# Firestore Database Schema Specification

This document details the collection structure, field types, indexed fields, and document relationships for the Food Subscription & Ledger Management System backend.

---

## Collections Architecture

```
Firestore Root
├── customers/          (Customer Profile Master)
├── subscriptions/      (Customer Active & Legacy Subscriptions)
├── dailyDeliveries/    (Daily Meal Ticks & Delivery Status)
├── invoices/           (Itemized Invoices & Cancellation Adjustments)
├── payments/           (Payment Receipts & Transaction Log)
├── expenses/           (Operational Business Expenses)
└── settings/           (Global Configuration Singleton - 'global')
```

---

## 1. Collection: `customers`

**Document ID**: `cust_<10-char-hex>` (e.g. `cust_a1b2c3d4e5`)

```json
{
  "id": "cust_a1b2c3d4e5",
  "name": "Ravi Kumar",
  "phone": "9876543210",
  "address": "123 Main Street, Sector 4",
  "landmark": "Near City Park",
  "status": "active",        // "active", "paused", "cancelled", "archived"
  "is_deleted": false,        // Soft delete flag
  "created_at": "2026-07-25T08:00:00Z",
  "updated_at": "2026-07-25T08:00:00Z"
}
```

---

## 2. Collection: `subscriptions`

**Document ID**: `sub_<10-char-hex>`

```json
{
  "id": "sub_9876543210",
  "customer_id": "cust_a1b2c3d4e5",
  "subscription_type": "monthly", // "monthly", "weekly", "trial", "custom"
  "start_date": "2026-07-25",
  "end_date": "2026-08-24",
  "original_end_date": "2026-08-24",
  "meals": {
    "breakfast": true,
    "lunch": true,
    "dinner": true
  },
  "preferences": {
    "breakfast": "veg",
    "lunch": "non_veg",
    "dinner": "veg"
  },
  "rates": {
    "breakfast_price": 64.0,
    "lunch_price": 80.0,         // Discounted rate for 3-meal subscription
    "dinner_price": 64.0,
    "delivery_charge": 0.0
  },
  "status": "active",             // "active", "completed", "replaced"
  "pending_breakfast_extensions": 2,
  "pending_lunch_extensions": 1,
  "pending_dinner_extensions": 3,
  "total_extended_days": 6,
  "created_at": "2026-07-25T08:00:00Z",
  "updated_at": "2026-07-25T08:00:00Z"
}
```

---

## 3. Collection: `dailyDeliveries`

**Document ID**: `del_<YYYY-MM-DD>_<customer_id>`

```json
{
  "id": "del_2026-07-25_cust_a1b2c3d4e5",
  "date": "2026-07-25",
  "customer_id": "cust_a1b2c3d4e5",
  "subscription_id": "sub_9876543210",
  "customer_name": "Ravi Kumar",
  "breakfast": {
    "delivered": true,
    "cancelled": false,
    "preference": "veg"
  },
  "lunch": {
    "delivered": true,
    "cancelled": false,
    "preference": "non_veg"
  },
  "dinner": {
    "delivered": false,
    "cancelled": true,
    "preference": "veg"
  },
  "notes": "Dinner cancelled by customer at 5 PM",
  "created_at": "2026-07-25T00:00:00Z",
  "updated_at": "2026-07-25T17:05:00Z"
}
```

---

## 4. Collection: `invoices`

**Document ID**: `inv_<10-char-hex>`

```json
{
  "id": "inv_f1e2d3c4b5",
  "invoice_number": "INV-20260725-88A1",
  "customer_id": "cust_a1b2c3d4e5",
  "subscription_id": "sub_9876543210",
  "customer_name": "Ravi Kumar",
  "customer_phone": "9876543210",
  "billing_date": "2026-07-25",
  "start_date": "2026-07-25",
  "end_date": "2026-08-24",
  "items": [
    {
      "description": "Breakfast Plan (26 Days @ ₹64.0/meal)",
      "quantity": 26,
      "unit_price": 64.0,
      "total_price": 1664.0
    },
    {
      "description": "Lunch Plan (26 Days @ ₹80.0/meal)",
      "quantity": 26,
      "unit_price": 80.0,
      "total_price": 2080.0
    },
    {
      "description": "Dinner Plan (26 Days @ ₹64.0/meal)",
      "quantity": 26,
      "unit_price": 64.0,
      "total_price": 1664.0
    }
  ],
  "breakdown": {
    "breakfast_total": 1664.0,
    "lunch_total": 2080.0,
    "dinner_total": 1664.0,
    "delivery_total": 0.0,
    "gross_amount": 5408.0,
    "discount_amount": 0.0,
    "net_amount": 5408.0
  },
  "cancellation_summary": null,
  "status": "issued",              // "issued", "partially_paid", "paid", "adjusted"
  "created_at": "2026-07-25T08:00:00Z",
  "updated_at": "2026-07-25T08:00:00Z"
}
```

---

## 5. Collection: `payments`

**Document ID**: `pay_<10-char-hex>`

```json
{
  "id": "pay_1122334455",
  "receipt_number": "RCP-20260725-77B2",
  "customer_id": "cust_a1b2c3d4e5",
  "customer_name": "Ravi Kumar",
  "amount": 3000.0,
  "payment_method": "upi",       // "cash", "upi", "bank_transfer", "cheque"
  "payment_date": "2026-07-25",
  "reference_number": "UPI9988776655",
  "notes": "Advance subscription payment",
  "created_at": "2026-07-25T09:30:00Z"
}
```

---

## 6. Collection: `expenses`

**Document ID**: `exp_<10-char-hex>`

```json
{
  "id": "exp_3344556677",
  "date": "2026-07-25",
  "category": "vegetables",
  "amount": 1250.0,
  "description": "Fresh vegetables purchase from wholesale market",
  "paid_to": "Koyambedu Wholesale Market",
  "created_at": "2026-07-25T06:00:00Z"
}
```

---

## 7. Collection: `settings`

**Document ID**: `global` (Singleton)

```json
{
  "id": "global",
  "breakfast_price": 64.0,
  "lunch_price": 100.0,
  "dinner_price": 64.0,
  "three_meal_lunch_discount_rate": 80.0,
  "delivery_charge_per_day": 0.0,
  "default_monthly_days": 26,
  "sunday_holiday_enabled": true
}
```
