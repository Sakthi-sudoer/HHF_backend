# Complete REST API Endpoint Specification

## Standard API Response Format

All responses follow this JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Human readable string",
  "errors": []
}
```

---

## 1. Dashboard Module

### `GET /api/v1/dashboard`
- **Purpose**: Fetch real-time today operational stats and financial summary.
- **Query Parameters**:
  - `period` (`string`): `'today'`, `'this_week'`, `'this_month'`, `'custom'` (Default: `'today'`).
  - `start_date` (`string`): Optional `YYYY-MM-DD` if period is `'custom'`.
  - `end_date` (`string`): Optional `YYYY-MM-DD` if period is `'custom'`.

---

## 2. Customer Management Module (Full CRUD & Soft Delete)

### `POST /api/v1/customers`
- **Purpose**: Register a new customer.
- **Request Body**:
```json
{
  "name": "Ravi Kumar",
  "phone": "9876543210",
  "address": "123 Main Street, Sector 4",
  "landmark": "Near City Park"
}
```

### `GET /api/v1/customers`
- **Query Parameter**: `query` (search name, phone, address).

### `GET /api/v1/customers/{customer_id}`
- **Purpose**: Get customer profile.

### `PUT /api/v1/customers/{customer_id}`
- **Purpose**: Edit/Update existing customer details.
- **Request Body**:
```json
{
  "name": "Ravi Kumar Updated",
  "phone": "9876543210",
  "address": "456 New Colony",
  "landmark": "Opposite Metro Station",
  "status": "active"
}
```

### `DELETE /api/v1/customers/{customer_id}`
- **Purpose**: Soft-delete / Archive customer profile (`status = "archived"`, `is_deleted = true`).

---

## 3. Subscription Engine Module (CRUD & Soft Delete)

### `POST /api/v1/subscriptions`
- **Purpose**: Create customer subscription & auto-generate initial invoice.

### `GET /api/v1/subscriptions/{subscription_id}`
- **Purpose**: Fetch subscription details.

### `DELETE /api/v1/subscriptions/{subscription_id}`
- **Purpose**: Cancel / Soft-delete subscription (`status = "cancelled"`, `is_deleted = true`) and auto-calculate remaining meal credit refunds.

---

## 4. Daily Delivery Sheet Engine Module

### `GET /api/v1/deliveries/sheet`
- **Query Parameter**: `target_date` (`YYYY-MM-DD`, default: today).

### `POST /api/v1/deliveries/cancel-meal`
- **Purpose**: Untick/cancel a meal (Breakfast, Lunch, Dinner) and auto-extend end date.

---

## 5. Ledger & Payments Module (CRUD & Void/Soft Delete)

### `GET /api/v1/ledger/customer/{customer_id}`
- **Purpose**: Fetch GPay-style transaction timeline & running balance.

### `POST /api/v1/payments`
- **Purpose**: Record customer payment.

### `DELETE /api/v1/payments/{payment_id}`
- **Purpose**: Void / Soft-delete recorded payment (`status = "voided"`, `is_deleted = true`) and adjust running balance.

---

## 6. Expenses Module (Full CRUD & Soft Delete)

### `POST /api/v1/expenses`
- **Purpose**: Record operational expense.

### `GET /api/v1/expenses`
- **Purpose**: List all active operational expenses.

### `PUT /api/v1/expenses/{expense_id}`
- **Purpose**: Edit/Update existing operational expense record.

### `DELETE /api/v1/expenses/{expense_id}`
- **Purpose**: Soft-delete operational expense record (`is_deleted = true`).
