# Core Business Rules & Algorithm Specifications

This document defines the mathematical models, business rules, and calculation engines governing the Food Subscription & Ledger Management System backend.

---

## 1. Subscription Engine Algorithms

### A. Working Day & Sunday Holiday Logic
When calculating subscription end dates:
- If `SUNDAY_HOLIDAY_ENABLED` is `true`:
  - Sundays are non-working holidays.
  - Subscription durations count only active working days (Monday through Saturday).
- **Monthly Subscription**: Default duration is 26 working days.
- **Weekly Subscription**: Default duration is 6 working days.
- **Trial Subscription**: Exact start and end dates specified by user without auto-skipping.
- **Custom Subscription**: User specifies custom working day count $N_{work}$ or exact start and end dates.

```
Function AddWorkingDays(StartDate, NumDays, SkipSundays):
    CurrentDate = StartDate
    WorkingDaysAdded = 0
    While WorkingDaysAdded < NumDays:
        If Not (SkipSundays And DayOfWeek(CurrentDate) == Sunday):
            WorkingDaysAdded += 1
            If WorkingDaysAdded == NumDays:
                Break
        CurrentDate += 1 Day
    Return CurrentDate
```

---

### B. Three-Meal Pricing Discount Rule
- Standard meal rates:
  - Breakfast = ₹64.0
  - Lunch = ₹100.0
  - Dinner = ₹64.0
- **3-Meal Special Discount**: If a customer selects **all 3 meals** (Breakfast, Lunch, Dinner), the Lunch rate automatically drops from **₹100.0 to ₹80.0** per day (saving ₹20/day).
- Rate overrides specified during subscription creation take precedence over default global rules.

---

## 2. Delivery & Meal Extension Engine Algorithms

### A. Auto-Generated Daily Sheets
- At 00:00 or upon user query for date $D$:
  - Query all subscriptions where `status == "active"` AND `start_date <= D <= end_date`.
  - If $D$ is a Sunday and `SUNDAY_HOLIDAY_ENABLED` is true:
    - Meal delivery ticks are automatically set to `delivered = false`.
  - Otherwise, delivery ticks (`breakfast`, `lunch`, `dinner`) are pre-populated based on subscription meal flags (`true`/`false`) and food preferences (`veg`/`non_veg`).

---

### B. Meal Cancellation & Automatic/Manual Extension Logic
When staff unticks a meal on the Daily Sheet for date $D$:
- Meal `delivered` status is updated to `false`, and `cancelled` is set to `true`.
- **Automatic Extension**:
  - Increments pending meal counter for cancelled meal type (`pending_breakfast_extensions`, `pending_lunch_extensions`, or `pending_dinner_extensions`).
  - System adds **+1 working day** to current `end_date`, skipping Sundays.
  - Total extended days counter (`total_extended_days`) is incremented by 1.
- **Manual Extension**:
  - Staff picks exact extension date from calendar.
  - `end_date` is updated to $\max(\text{current\_end\_date}, \text{manual\_date})$.

```
Function CancelMealAndExtend(SubscriptionID, MealType, Mode, ManualDate):
    Sub = LoadSubscription(SubscriptionID)
    If Mode == "automatic":
        NewEndDate = AddWorkingDays(Sub.end_date + 1 Day, 1, SkipSundays=True)
    Else:
        NewEndDate = Max(Sub.end_date, ManualDate)
    
    Sub.pending_meal_extensions[MealType] += 1
    Sub.total_extended_days += 1
    Sub.end_date = NewEndDate
    SaveSubscription(Sub)
    Return Sub
```

---

## 3. Invoice Engine Algorithms

### A. Initial Invoice Generation
Initial invoice gross amount calculation:
$$\text{Gross Amount} = N_{work} \times (P_{breakfast} + P_{lunch} + P_{dinner} + P_{delivery})$$
Where:
- $N_{work}$ = Total working days in subscription period.
- $P_{meal}$ = Active meal unit price (0 if meal disabled).
- $P_{delivery}$ = Daily delivery charge per day.

---

### B. Early Cancellation & Unused Meal Refund Calculation
If a subscription is terminated early or cancelled:

1. **Consumed Amount**:
$$\text{Consumed Amount} = \sum_{\text{delivered}} P_{meal} + (U_{days} \times P_{delivery})$$
Where $U_{days}$ is count of days with at least one delivered meal.

2. **Unused Meals Credit**:
$$\text{Unused Credit} = \max(0, \text{Original Invoice Net Amount} - \text{Consumed Amount})$$

3. **Pending Balance / Refund Calculation**:
$$\text{Final Adjusted Invoice Total} = \text{Consumed Amount}$$
$$\text{Pending Balance} = \max(0, \text{Final Adjusted Invoice Total} - \text{Total Payments Made})$$
$$\text{Refund Due} = \max(0, \text{Total Payments Made} - \text{Final Adjusted Invoice Total})$$

---

## 4. Ledger & Accounting Engine Algorithms

### Running Balance Formula
For any customer account at transaction $k$:
$$\text{Balance}_k = \text{Balance}_{k-1} + \text{Debit}_k - \text{Credit}_k$$
- Invoices add **Debit** amount (+).
- Payments add **Credit** amount (-).
- Positive Balance (> 0) = Customer has **Pending Balance**.
- Zero Balance (= 0) = Fully Paid.
- Negative Balance (< 0) = Customer has **Advance Credit**.

---

## 5. Dashboard Engine Algorithms

### A. Operational Counts
For today's date $D_{today}$:
- Count delivered meals per category:
  $$\text{Breakfast}_{\text{Veg}}, \text{Breakfast}_{\text{NonVeg}}, \text{Lunch}_{\text{Veg}}, \text{Lunch}_{\text{NonVeg}}, \text{Dinner}_{\text{Veg}}, \text{Dinner}_{\text{NonVeg}}$$

### B. Profit Calculation
$$\text{Profit} = \text{Accrued Revenue} - \text{Total Operational Expenses}$$
Where:
- $\text{Accrued Revenue}$ = Total Net Amount of invoices issued/adjusted in period.
- $\text{Total Operational Expenses}$ = Sum of expense records in period.
