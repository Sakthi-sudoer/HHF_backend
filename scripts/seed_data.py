import sys
import os
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.customer import CustomerCreate
from app.models.subscription import (
    SubscriptionCreate, SubscriptionType, MealSelection, FoodPreferenceSelection, FoodPreference
)
from app.models.payment import PaymentCreate
from app.models.delivery import DeliveryMealCancelRequest
from app.models.expense import ExpenseCreate
from app.services.customer_service import CustomerService
from app.services.subscription_engine import SubscriptionEngine
from app.services.delivery_engine import DeliveryEngine
from app.services.ledger_engine import LedgerEngine
from app.services.invoice_engine import InvoiceEngine
from app.repositories.expense_repository import ExpenseRepository

def run_seed():
    print("=" * 70)
    print(" Seeding Sample Test Data for Food Subscription & Ledger Backend")
    print("=" * 70)

    cust_service = CustomerService()
    sub_engine = SubscriptionEngine()
    del_engine = DeliveryEngine()
    ledger_engine = LedgerEngine()
    inv_engine = InvoiceEngine()
    exp_repo = ExpenseRepository()

    # 1. Create Sample Customers
    print("[1/5] Creating Sample Customers...")
    c1 = cust_service.create_customer(CustomerCreate(
        name="Ravi Kumar",
        phone="9876543210",
        address="Flat 402, Green Park Apartments",
        landmark="Near Central Mall"
    ))
    c2 = cust_service.create_customer(CustomerCreate(
        name="Mani Kandan",
        phone="9123456789",
        address="Plot 12, Lake View Colony",
        landmark="Opposite Water Tank"
    ))
    print(f"  Created: {c1.name} ({c1.id})")
    print(f"  Created: {c2.name} ({c2.id})")

    # 2. Create Subscriptions
    print("\n[2/5] Creating Monthly & Weekly Subscriptions...")
    s1 = sub_engine.create_subscription(SubscriptionCreate(
        customer_id=c1.id,
        subscription_type=SubscriptionType.MONTHLY,
        start_date=date.today(),
        meals=MealSelection(breakfast=True, lunch=True, dinner=True),
        preferences=FoodPreferenceSelection(
            breakfast=FoodPreference.VEG,
            lunch=FoodPreference.NON_VEG,
            dinner=FoodPreference.VEG
        )
    ))
    inv_engine.generate_initial_invoice(s1.id)

    s2 = sub_engine.create_subscription(SubscriptionCreate(
        customer_id=c2.id,
        subscription_type=SubscriptionType.WEEKLY,
        start_date=date.today(),
        meals=MealSelection(breakfast=False, lunch=True, dinner=True),
        preferences=FoodPreferenceSelection(
            breakfast=FoodPreference.VEG,
            lunch=FoodPreference.NON_VEG,
            dinner=FoodPreference.NON_VEG
        )
    ))
    inv_engine.generate_initial_invoice(s2.id)

    print(f"  Subscription 1 (Monthly 3-Meal): {s1.id} -> End Date: {s1.end_date}")
    print(f"  Subscription 2 (Weekly 2-Meal): {s2.id} -> End Date: {s2.end_date}")

    # 3. Generate Daily Sheet & Cancel a meal
    print("\n[3/5] Auto-generating Daily Sheet & Simulating Dinner Cancellation...")
    sheet = del_engine.get_daily_sheet(date.today())
    print(f"  Generated {len(sheet)} daily delivery records for today.")

    cancel_res = del_engine.cancel_meal_and_extend(
        target_date=date.today(),
        customer_id=c1.id,
        cancel_req=DeliveryMealCancelRequest(meal_type="dinner", extension_mode="automatic")
    )
    print(f"  Cancelled Dinner for {c1.name} -> Subscription Extended to {cancel_res.new_subscription_end_date}")

    # 4. Record Payments
    print("\n[4/5] Recording Payments...")
    p1 = ledger_engine.record_payment(PaymentCreate(
        customer_id=c1.id,
        amount=3000.0,
        payment_method="upi",
        payment_date=date.today(),
        reference_number="UPI8899776611",
        notes="Advance Monthly Payment"
    ))
    print(f"  Recorded Payment: ₹3000 via UPI (Receipt: {p1.receipt_number})")

    # 5. Record Operational Expense
    print("\n[5/5] Recording Sample Expense...")
    exp_dict = {
        "id": "exp_sample_1",
        "date": date.today().isoformat(),
        "category": "vegetables",
        "amount": 1500.0,
        "description": "Vegetables & Groceries",
        "paid_to": "Local Market",
        "created_at": date.today().isoformat() + "T00:00:00Z"
    }
    exp_repo.create("exp_sample_1", exp_dict)
    print("  Recorded Expense: ₹1500 for Vegetables & Groceries")

    print("=" * 70)
    print(" [SUCCESS] Sample Data Seeding Completed!")
    print(" You can now test the Dashboard, Ledger, and Daily Sheets in Swagger UI!")
    print("=" * 70)

if __name__ == "__main__":
    run_seed()
