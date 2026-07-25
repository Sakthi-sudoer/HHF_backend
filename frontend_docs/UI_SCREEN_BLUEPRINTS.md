# UI Screen Wireframes & Blueprint Specifications (With Edit & Soft-Delete Features)

This document defines the wireframes, components, user flows, edit modals, and soft-delete interactions for building a responsive UI (Web/Mobile/Desktop).

---

## Screen 1: Dashboard

### Layout & Components
1. **Top Bar**: System title, current date indicator.
2. **Operational Stats Cards (Today's Meals)**:
   - **Breakfast**: Veg Count, Non-Veg Count, Total Count
   - **Lunch**: Veg Count, Non-Veg Count, Total Count
   - **Dinner**: Veg Count, Non-Veg Count, Total Count
3. **Financial Metric Cards**:
   - `[Today]` `[This Week]` `[This Month]` `[Custom Date]`
   - Today's Collection, Pending Amount, Today's Revenue, Expenses, Profit.

---

## Screen 2: Customer Management (With Edit & Soft Delete)

### Layout & Components
1. **Header & Actions**: Instant search input (Name, Phone, Address), `+ Add Customer` button.
2. **Customer List Table / Cards**:
   - Customer Name, Phone, Address, Landmark
   - Status Badge: `[Active - Green]` `[Paused - Yellow]` `[Archived - Gray]`
   - Action Buttons: `[View Ledger]` `[✏️ Edit]` `[🗑️ Archive]`
3. **Edit Customer Modal**:
   - Pre-filled inputs: Name, Phone, Address, Landmark, Status (`Active` / `Paused` / `Archived`).
   - `Save Changes` calls `PUT /api/v1/customers/{id}`.
4. **Archive (Soft Delete) Confirmation Modal**:
   - *"Are you sure you want to archive this customer? All historical invoices and delivery records will be preserved."*
   - `Confirm Archive` calls `DELETE /api/v1/customers/{id}`.

---

## Screen 3: Subscription Engine (With Edit & Cancellation)

### Layout & Components
1. **Customer Selection**: Searchable customer dropdown.
2. **Subscription Type Selector**: `(•) Monthly` `( ) Weekly` `( ) Trial` `( ) Custom`.
3. **Action Buttons**: `[Create Subscription]` `[🗑️ Cancel Subscription]`
4. **Cancel Subscription Modal**:
   - Displays calculated unconsumed meal credit refund amount.
   - `Confirm Cancellation` calls `DELETE /api/v1/subscriptions/{id}`.

---

## Screen 4: Daily Delivery Sheet

### Layout & Components
1. **Date Header Navigation**: `< Previous` `[ Date Picker ]` `Next >`
2. **Delivery Sheet Table**:
   - Columns: `Customer Name`, `Breakfast`, `Lunch`, `Dinner`, `Actions`
   - Cell Ticks: `✓` (Delivered), `X` (Cancelled), `-` (Not Subscribed)
3. **Meal Cancellation Trigger Popup**:
   - When staff unticks a meal: Popup asks *"Extend subscription?"* $\to$ `Automatic` / `Manual Date`.

---

## Screen 5: Customer Ledger & Invoices (With Payment Voiding)

### Layout & Components
1. **GPay-style Double-Entry Transaction Timeline**:
   - Invoice Card (Debit: ₹5400)
   - Payment Card (Credit: ₹3000, Method: UPI, Action: `[🗑️ Void Payment]`)
2. **Void Payment Modal**:
   - *"Are you sure you want to void payment RCP-1234? The customer's running balance will be adjusted automatically."*
   - `Confirm Void` calls `DELETE /api/v1/payments/{id}`.

---

## Screen 6: Operational Expense Tracker (With Edit & Delete)

### Layout & Components
1. **Add / Edit Expense Card**:
   - Category dropdown, Amount, Description, Date, Paid To.
   - Action Buttons: `[+ Add Expense]` `[✏️ Edit]` `[🗑️ Delete]`
2. **Edit Expense Modal**:
   - Pre-filled form $\to$ Submission calls `PUT /api/v1/expenses/{id}`.
3. **Delete Expense Modal**:
   - Soft-deletes expense record $\to$ Calls `DELETE /api/v1/expenses/{id}`.
