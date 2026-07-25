import uuid
from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from app.models.subscription import SubscriptionResponse, SubscriptionCreate, SubscriptionType
from app.models.invoice import InvoiceResponse
from app.services.subscription_engine import SubscriptionEngine
from app.services.invoice_engine import InvoiceEngine
from app.repositories.subscription_repository import SubscriptionRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.core.exceptions import EntityNotFoundException, BusinessRuleViolationException
from app.core.logging import logger

class RenewalEngine:
    def __init__(self):
        self.sub_repo = SubscriptionRepository()
        self.cust_repo = CustomerRepository()
        self.invoice_repo = InvoiceRepository()
        self.payment_repo = PaymentRepository()
        self.sub_engine = SubscriptionEngine()
        self.inv_engine = InvoiceEngine()

    def get_expiring_subscriptions(self, days_threshold: int = 7) -> List[Dict[str, Any]]:
        """
        Fetches subscriptions expiring within 7, 3, or 1 day(s).
        """
        active_subs = self.sub_repo.get_all_active_subscriptions()
        today = date.today()
        expiring = []

        active_custs = self.cust_repo.get_active_customers()
        cust_map = {c["id"]: c for c in active_custs}

        for sub in active_subs:
            try:
                end_d = date.fromisoformat(str(sub["end_date"]))
            except Exception:
                continue

            days_remaining = (end_d - today).days

            if days_remaining <= days_threshold:
                cust = cust_map.get(sub["customer_id"], {})
                reminder_status = "none"
                if days_remaining <= 1:
                    reminder_status = "1_day"
                elif days_remaining <= 3:
                    reminder_status = "3_days"
                elif days_remaining <= 7:
                    reminder_status = "7_days"
                if days_remaining < 0:
                    reminder_status = "expired"

                expiring.append({
                    "subscription_id": sub["id"],
                    "customer_id": sub["customer_id"],
                    "customer_name": cust.get("name", "Customer"),
                    "customer_phone": cust.get("phone", "N/A"),
                    "subscription_type": sub.get("subscription_type", "monthly"),
                    "end_date": str(end_d),
                    "days_remaining": days_remaining,
                    "expiry_reminder_status": reminder_status
                })

        expiring.sort(key=lambda x: x["days_remaining"])
        return expiring

    def renew_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Renews an expiring or completed subscription:
        1. Calculates next start date (day after current end date).
        2. Creates next subscription plan carrying meals & preferences.
        3. Auto-generates next HHF-YYYYMM-XXXX invoice.
        """
        current_sub = self.sub_repo.get_by_id(subscription_id)
        if not current_sub:
            raise EntityNotFoundException("Subscription", subscription_id)

        current_end = date.fromisoformat(str(current_sub["end_date"]))
        today = date.today()

        next_start = current_end + timedelta(days=1)
        if next_start < today:
            next_start = today

        sub_create = SubscriptionCreate(
            customer_id=current_sub["customer_id"],
            subscription_type=SubscriptionType(current_sub.get("subscription_type", "monthly")),
            start_date=next_start,
            meals=current_sub["meals"],
            preferences=current_sub["preferences"],
            rates=current_sub.get("rates")
        )

        new_sub = self.sub_engine.create_subscription(sub_create)

        # Mark new sub as renewed from current_sub
        self.sub_repo.update(new_sub.id, {"renewed_from_subscription_id": subscription_id})

        # Generate next invoice
        new_inv = self.inv_engine.generate_initial_invoice(new_sub.id)

        logger.info(f"Renewed subscription {subscription_id} -> New Subscription {new_sub.id}, Invoice {new_inv.invoice_number}")

        return {
            "renewed_subscription": new_sub,
            "new_invoice": new_inv,
            "previous_subscription_id": subscription_id
        }
