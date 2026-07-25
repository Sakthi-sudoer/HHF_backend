# Business Rules & Frontend Independence Principles

> [!IMPORTANT]
> The backend contains **100% of the business logic**.
> Frontends MUST NOT perform business calculations. Frontends simply display values returned by the backend.

---

## Strict Rules for Frontend Developers & AI Agents

### 1. Zero Price & Tax Calculations on Frontend
- **Do NOT** calculate meal prices or total invoice amounts on the frontend.
- When creating a subscription, pass the selected meals and dates to `POST /api/v1/subscriptions`. The backend automatically calculates plan days, meal rates, discounts, daily delivery charges, and initial invoice total.

### 2. Zero Date Math for Extensions
- **Do NOT** calculate subscription end dates, Sunday holiday skips, or manual extension dates.
- When staff unticks a meal on the Daily Sheet (`POST /api/v1/deliveries/cancel-meal`), the response returns rich metadata:
  ```json
  {
    "success": true,
    "data": {
      "mealCancelled": true,
      "cancelledMealType": "dinner",
      "extensionCreated": true,
      "extensionMode": "automatic",
      "extensionDate": "2026-08-01",
      "pendingExtensionsCount": 1,
      "newSubscriptionEndDate": "2026-08-01",
      "balanceUpdated": true,
      "invoiceRequiresRegeneration": true
    }
  }
  ```
  The frontend should simply update the UI to show `newSubscriptionEndDate`.

### 3. Zero Ledger Balance Calculations
- **Do NOT** subtract payments from invoices locally.
- Use `GET /api/v1/ledger/customer/{customer_id}` to retrieve the double-entry timeline, current outstanding balance, total invoiced, total paid, and payment status (`paid`, `partially_paid`, `overdue`, `advance`).

### 4. Zero Profit / Expense Math
- Use `GET /api/v1/dashboard?period=today` to get financial cards:
  - `todaysCollection`
  - `pendingAmount`
  - `todaysRevenue`
  - `totalExpenses`
  - `profit` (where $\text{Profit} = \text{Revenue} - \text{Expenses}$)
