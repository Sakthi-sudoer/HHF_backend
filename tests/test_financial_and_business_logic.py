import pytest
from datetime import date, timedelta
from app.models.customer import CustomerCreate
from app.models.subscription import (
    SubscriptionCreate, SubscriptionType, MealSelection, FoodPreferenceSelection, FoodPreference, SubscriptionRates
)
from app.models.payment import PaymentCreate
from app.models.delivery import DeliveryMealCancelRequest
from app.services.customer_service import CustomerService
from app.services.subscription_engine import SubscriptionEngine
from app.services.delivery_engine import DeliveryEngine
from app.services.invoice_engine import InvoiceEngine
from app.services.ledger_engine import LedgerEngine
from app.services.dashboard_engine import DashboardEngine
from app.repositories.expense_repository import ExpenseRepository

def test_working_days_and_sunday_skip_math():
    engine = SubscriptionEngine()
    
    # 2026-07-25 is a Saturday
    start_d = date(2026, 7, 25)
    
    # 1 working day starting Saturday -> should land on Saturday 2026-07-25
    assert engine.add_working_days(start_d, 1, skip_sundays=True) == date(2026, 7, 25)
    
    # 2 working days starting Saturday -> Sunday (July 26) skipped -> Monday (July 27)
    assert engine.add_working_days(start_d, 2, skip_sundays=True) == date(2026, 7, 27)

    # Monthly (26 working days) starting Saturday July 25 2026:
    # July has 7 days remaining (Sat 25, Mon 27, Tue 28, Wed 29, Thu 30, Fri 31 = 6 working days)
    # Aug needs 20 working days:
    # Aug 1 (Sat)=1, Aug 3-8 (Mon-Sat)=6, Aug 10-15 (Mon-Sat)=6, Aug 17-22 (Mon-Sat)=6, Aug 24 (Mon)=1 -> Total 20 working days in Aug
    end_d = engine.add_working_days(start_d, 26, skip_sundays=True)
    assert end_d == date(2026, 8, 24)

def test_subscription_pricing_and_discount():
    cust_s = CustomerService()
    sub_e = SubscriptionEngine()
    inv_e = InvoiceEngine()

    c = cust_s.create_customer(CustomerCreate(name="Test Financial User", phone="9900112233", address="Street 1"))
    
    # 3 Meals selected -> Lunch rate should default to 80.0 (Discounted from 100.0)
    sub = sub_e.create_subscription(SubscriptionCreate(
        customer_id=c.id,
        subscription_type=SubscriptionType.MONTHLY,
        start_date=date(2026, 7, 25),
        meals=MealSelection(breakfast=True, lunch=True, dinner=True),
        preferences=FoodPreferenceSelection(breakfast=FoodPreference.VEG, lunch=FoodPreference.NON_VEG, dinner=FoodPreference.VEG)
    ))
    
    assert sub.rates.breakfast_price == 64.0
    assert sub.rates.lunch_price == 80.0
    assert sub.rates.dinner_price == 64.0

    # Invoice for 26 days:
    # Breakfast = 26 * 64 = 1664
    # Lunch = 26 * 80 = 2080
    # Dinner = 26 * 64 = 1664
    # Gross Total = 5408.0
    inv = inv_e.generate_initial_invoice(sub.id)
    assert inv.breakdown.breakfast_total == 1664.0
    assert inv.breakdown.lunch_total == 2080.0
    assert inv.breakdown.dinner_total == 1664.0
    assert inv.breakdown.net_amount == 5408.0

def test_meal_cancellation_auto_extension_math():
    cust_s = CustomerService()
    sub_e = SubscriptionEngine()
    del_e = DeliveryEngine()

    c = cust_s.create_customer(CustomerCreate(name="Cancel Test", phone="9900112244", address="Street 2"))
    sub = sub_e.create_subscription(SubscriptionCreate(
        customer_id=c.id,
        subscription_type=SubscriptionType.WEEKLY, # 6 working days
        start_date=date(2026, 7, 25), # Sat Jul 25 -> End date Fri Jul 31 (6 days: Sat 25, Mon 27, Tue 28, Wed 29, Thu 30, Fri 31)
        meals=MealSelection(breakfast=True, lunch=True, dinner=True),
        preferences=FoodPreferenceSelection(breakfast=FoodPreference.VEG, lunch=FoodPreference.NON_VEG, dinner=FoodPreference.VEG)
    ))
    
    orig_end = sub.end_date
    assert orig_end == date(2026, 7, 31)

    # Cancel dinner on Sat Jul 25
    res = del_e.cancel_meal_and_extend(
        target_date=date(2026, 7, 25),
        customer_id=c.id,
        cancel_req=DeliveryMealCancelRequest(meal_type="dinner", extension_mode="automatic")
    )

    # End date should move +1 working day from Fri Jul 31:
    # Next day after Fri Jul 31 is Sat Aug 1 -> working day!
    assert res.new_subscription_end_date == date(2026, 8, 1)
    assert res.pending_extensions_count == 1

def test_invoice_cancellation_adjustment_and_refund_math():
    cust_s = CustomerService()
    sub_e = SubscriptionEngine()
    del_e = DeliveryEngine()
    inv_e = InvoiceEngine()
    ledger_e = LedgerEngine()

    c = cust_s.create_customer(CustomerCreate(name="Refund Test", phone="9900112255", address="Street 3"))
    sub = sub_e.create_subscription(SubscriptionCreate(
        customer_id=c.id,
        subscription_type=SubscriptionType.WEEKLY,
        start_date=date(2026, 7, 25),
        meals=MealSelection(breakfast=True, lunch=True, dinner=True),
        preferences=FoodPreferenceSelection(breakfast=FoodPreference.VEG, lunch=FoodPreference.NON_VEG, dinner=FoodPreference.VEG)
    ))
    # Original Weekly 6 days @ 208/day (64+80+64) = 1248.0
    orig_inv = inv_e.generate_initial_invoice(sub.id)
    assert orig_inv.breakdown.net_amount == 1248.0

    # Customer pays 1500.0 (Advance)
    ledger_e.record_payment(PaymentCreate(
        customer_id=c.id,
        amount=1500.0,
        payment_method="upi",
        payment_date=date(2026, 7, 25)
    ))

    # Delivery sheet auto-populates, 1 day consumed (Jul 25) = 208.0 consumed
    del_e.get_daily_sheet(date(2026, 7, 25))

    # Recalculate early cancellation invoice:
    adj_inv = inv_e.calculate_cancellation_adjustment(sub.id)
    canc = adj_inv.cancellation_summary

    assert canc.original_invoice_total == 1248.0
    assert canc.consumed_amount == 208.0
    assert canc.unused_meals_credit == 1040.0
    assert canc.final_adjusted_invoice_total == 208.0
    assert canc.total_paid == 1500.0
    assert canc.pending_balance == 0.0
    assert canc.refund_due == 1292.0 # 1500 - 208 = 1292

def test_ledger_running_balance_math():
    cust_s = CustomerService()
    sub_e = SubscriptionEngine()
    inv_e = InvoiceEngine()
    ledger_e = LedgerEngine()

    c = cust_s.create_customer(CustomerCreate(name="Ledger Test", phone="9900112266", address="Street 4"))
    sub = sub_e.create_subscription(SubscriptionCreate(
        customer_id=c.id,
        subscription_type=SubscriptionType.WEEKLY,
        start_date=date(2026, 7, 25),
        meals=MealSelection(breakfast=True, lunch=True, dinner=True),
        preferences=FoodPreferenceSelection(breakfast=FoodPreference.VEG, lunch=FoodPreference.NON_VEG, dinner=FoodPreference.VEG)
    ))
    inv = inv_e.generate_initial_invoice(sub.id) # 1248.0

    # Before payment: Balance = 1248.0
    l1 = ledger_e.get_customer_ledger(c.id)
    assert l1.total_invoiced == 1248.0
    assert l1.total_paid == 0.0
    assert l1.current_balance == 1248.0
    assert l1.payment_status == "overdue"

    # Partial Payment of 500.0
    ledger_e.record_payment(PaymentCreate(
        customer_id=c.id,
        amount=500.0,
        payment_method="cash",
        payment_date=date(2026, 7, 25)
    ))
    l2 = ledger_e.get_customer_ledger(c.id)
    assert l2.total_paid == 500.0
    assert l2.current_balance == 748.0
    assert l2.payment_status == "partially_paid"

    # Full Remaining Payment of 748.0
    ledger_e.record_payment(PaymentCreate(
        customer_id=c.id,
        amount=748.0,
        payment_method="upi",
        payment_date=date(2026, 7, 25)
    ))
    l3 = ledger_e.get_customer_ledger(c.id)
    assert l3.total_paid == 1248.0
    assert l3.current_balance == 0.0
    assert l3.payment_status == "paid"

def test_profit_calculation_math():
    dash_e = DashboardEngine()
    exp_r = ExpenseRepository()

    # Profit = Revenue - Expenses
    summary = dash_e.get_dashboard_summary(period="today")
    exp = summary.financials.total_expenses
    rev = summary.financials.todays_revenue
    prof = summary.financials.profit
    
    assert round(rev - exp, 2) == prof
