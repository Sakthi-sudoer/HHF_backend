# Complete API Specification

The Food Subscription & Ledger Backend exposes RESTful endpoints organized into 10 modules:

1. `/dashboard` - Operational & Financial Analytics
2. `/customers` - Customer Management
3. `/subscriptions` - Subscription Engine
4. `/deliveries` - Daily Delivery Sheet Engine
5. `/invoices` - Invoice Engine
6. `/ledger` - Ledger Engine
7. `/payments` - Payment Processing Engine
8. `/expenses` - Operational Expense Tracking
9. `/reports` - Financial & Delivery Reporting
10. `/settings` - Global System Configurations

---

## Endpoint Summary Table

| Module | Method | Endpoint | Purpose |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `GET` | `/api/v1/dashboard` | Fetch today's meal counts & financial cards |
| **Customers** | `POST` | `/api/v1/customers` | Create new customer profile |
| **Customers** | `GET` | `/api/v1/customers` | Search & list active customers |
| **Customers** | `GET` | `/api/v1/customers/{id}` | Get customer profile details |
| **Customers** | `PUT` | `/api/v1/customers/{id}` | Update customer profile |
| **Customers** | `DELETE` | `/api/v1/customers/{id}` | Archive customer (Soft Delete) |
| **Subscriptions**| `POST` | `/api/v1/subscriptions` | Create subscription & auto-generate initial invoice |
| **Subscriptions**| `GET` | `/api/v1/subscriptions/{id}` | Get subscription & extension state |
| **Deliveries** | `GET` | `/api/v1/deliveries/sheet` | Get/auto-generate daily sheet for date |
| **Deliveries** | `POST` | `/api/v1/deliveries/cancel-meal`| Cancel meal & trigger extension engine |
| **Invoices** | `POST` | `/api/v1/invoices/generate/{sub_id}` | Generate initial itemized invoice |
| **Invoices** | `POST` | `/api/v1/invoices/recalculate/{sub_id}`| Recalculate cancellation credits & refunds |
| **Ledger** | `GET` | `/api/v1/ledger/customer/{id}` | Get customer GPay-style ledger statement |
| **Payments** | `POST` | `/api/v1/payments` | Record customer payment & generate receipt |
| **Expenses** | `POST` | `/api/v1/expenses` | Record operational expense |
| **Expenses** | `GET` | `/api/v1/expenses` | List all operational expenses |
| **Reports** | `GET` | `/api/v1/reports/financial` | Generate financial report for date range |
| **Reports** | `GET` | `/api/v1/reports/export/csv` | Export financial report as downloadable CSV |
| **Settings** | `GET` | `/api/v1/settings` | Get global meal rates & Sunday rules |
| **Settings** | `PUT` | `/api/v1/settings` | Update global settings |
