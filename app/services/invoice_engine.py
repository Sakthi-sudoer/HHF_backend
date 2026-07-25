import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from app.models.invoice import (
    InvoiceResponse, InvoiceItem, InvoiceBreakdown, InvoiceCancellationSummary
)
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.subscription_repository import SubscriptionRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.delivery_repository import DeliveryRepository
from app.services.settings_service import SettingsService
from app.core.exceptions import EntityNotFoundException, BusinessRuleViolationException
from app.core.logging import logger

class InvoiceEngine:
    def __init__(self):
        self.invoice_repo = InvoiceRepository()
        self.payment_repo = PaymentRepository()
        self.sub_repo = SubscriptionRepository()
        self.cust_repo = CustomerRepository()
        self.delivery_repo = DeliveryRepository()
        self.settings_service = SettingsService()

    def calculate_plan_working_days(self, start_d: date, end_d: date, skip_sundays: bool = True) -> int:
        curr = start_d
        days = 0
        while curr <= end_d:
            if not (skip_sundays and curr.weekday() == 6):
                days += 1
            curr += timedelta(days=1)
        return days

    def generate_initial_invoice(self, subscription_id: str) -> InvoiceResponse:
        sub = self.sub_repo.get_by_id(subscription_id)
        if not sub:
            raise EntityNotFoundException("Subscription", subscription_id)

        cust = self.cust_repo.get_by_id(sub["customer_id"])
        if not cust:
            raise EntityNotFoundException("Customer", sub["customer_id"])

        global_s = self.settings_service.get_settings()
        skip_sundays = global_s.sunday_holiday_enabled

        start_d = date.fromisoformat(sub["start_date"])
        end_d = date.fromisoformat(sub["end_date"])
        working_days = self.calculate_plan_working_days(start_d, end_d, skip_sundays)

        rates = sub["rates"]
        meals = sub["meals"]

        items: List[InvoiceItem] = []
        b_total = 0.0
        l_total = 0.0
        d_total = 0.0
        del_total = 0.0

        if meals["breakfast"]:
            b_total = round(working_days * rates["breakfast_price"], 2)
            items.append(InvoiceItem(
                description=f"Breakfast Plan ({working_days} Days @ ₹{rates['breakfast_price']}/meal)",
                quantity=working_days,
                unit_price=rates["breakfast_price"],
                total_price=b_total
            ))

        if meals["lunch"]:
            l_total = round(working_days * rates["lunch_price"], 2)
            items.append(InvoiceItem(
                description=f"Lunch Plan ({working_days} Days @ ₹{rates['lunch_price']}/meal)",
                quantity=working_days,
                unit_price=rates["lunch_price"],
                total_price=l_total
            ))

        if meals["dinner"]:
            d_total = round(working_days * rates["dinner_price"], 2)
            items.append(InvoiceItem(
                description=f"Dinner Plan ({working_days} Days @ ₹{rates['dinner_price']}/meal)",
                quantity=working_days,
                unit_price=rates["dinner_price"],
                total_price=d_total
            ))

        if rates["delivery_charge"] > 0:
            del_total = round(working_days * rates["delivery_charge"], 2)
            items.append(InvoiceItem(
                description=f"Daily Delivery Charge ({working_days} Days @ ₹{rates['delivery_charge']}/day)",
                quantity=working_days,
                unit_price=rates["delivery_charge"],
                total_price=del_total
            ))

        gross = round(b_total + l_total + d_total + del_total, 2)
        net = gross

        inv_id = f"inv_{uuid.uuid4().hex[:10]}"
        now_dt = datetime.now(timezone.utc)
        inv_num = f"INV-{now_dt.strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
        now_str = now_dt.isoformat()

        inv_dict = {
            "id": inv_id,
            "invoice_number": inv_num,
            "customer_id": sub["customer_id"],
            "subscription_id": subscription_id,
            "customer_name": cust["name"],
            "customer_phone": cust["phone"],
            "billing_date": date.today().isoformat(),
            "start_date": start_d.isoformat(),
            "end_date": end_d.isoformat(),
            "items": [item.model_dump() for item in items],
            "breakdown": {
                "breakfast_total": b_total,
                "lunch_total": l_total,
                "dinner_total": d_total,
                "delivery_total": del_total,
                "gross_amount": gross,
                "discount_amount": 0.0,
                "net_amount": net
            },
            "cancellation_summary": None,
            "status": "issued",
            "created_at": now_str,
            "updated_at": now_str
        }

        self.invoice_repo.create(inv_id, inv_dict)
        logger.info(f"Generated invoice {inv_num} for customer {sub['customer_id']} with total ₹{net}")
        return self._to_response(inv_dict)

    def calculate_cancellation_adjustment(self, subscription_id: str) -> InvoiceResponse:
        sub = self.sub_repo.get_by_id(subscription_id)
        if not sub:
            raise EntityNotFoundException("Subscription", subscription_id)

        inv = self.invoice_repo.get_latest_invoice_for_subscription(subscription_id)
        if not inv:
            inv_res = self.generate_initial_invoice(subscription_id)
            inv = inv_res.model_dump()

        start_d = date.fromisoformat(sub["start_date"])
        end_d = date.fromisoformat(sub["end_date"])
        
        deliveries = self.delivery_repo.get_customer_deliveries_range(
            sub["customer_id"], start_d.isoformat(), end_d.isoformat()
        )

        rates = sub["rates"]
        consumed_amount = 0.0
        used_days = 0

        for d in deliveries:
            day_has_delivery = False
            if d.get("breakfast", {}).get("delivered"):
                consumed_amount += rates["breakfast_price"]
                day_has_delivery = True
            if d.get("lunch", {}).get("delivered"):
                consumed_amount += rates["lunch_price"]
                day_has_delivery = True
            if d.get("dinner", {}).get("delivered"):
                consumed_amount += rates["dinner_price"]
                day_has_delivery = True
            if day_has_delivery:
                used_days += 1
                consumed_amount += rates["delivery_charge"]

        consumed_amount = round(consumed_amount, 2)
        orig_total = inv["breakdown"]["net_amount"]
        unused_credit = round(max(0.0, orig_total - consumed_amount), 2)
        delivery_adjustment = round(used_days * rates["delivery_charge"], 2)

        payments = self.payment_repo.get_by_customer(sub["customer_id"])
        total_paid = sum(p.get("amount", 0.0) for p in payments)

        final_adjusted_total = consumed_amount
        pending_balance = round(max(0.0, final_adjusted_total - total_paid), 2)
        refund_due = round(max(0.0, total_paid - final_adjusted_total), 2)

        cancel_summary = {
            "original_invoice_total": orig_total,
            "consumed_amount": consumed_amount,
            "unused_meals_credit": unused_credit,
            "delivery_adjustment": delivery_adjustment,
            "final_adjusted_invoice_total": final_adjusted_total,
            "total_paid": total_paid,
            "pending_balance": pending_balance,
            "refund_due": refund_due
        }

        inv["cancellation_summary"] = cancel_summary
        inv["status"] = "adjusted"
        inv["updated_at"] = datetime.now(timezone.utc).isoformat()
        self.invoice_repo.update(inv["id"], inv)

        return self._to_response(inv)

    def _to_response(self, d: Dict[str, Any]) -> InvoiceResponse:
        canc = None
        if d.get("cancellation_summary"):
            canc = InvoiceCancellationSummary(**d["cancellation_summary"])
        return InvoiceResponse(
            id=d["id"],
            invoice_number=d["invoice_number"],
            customer_id=d["customer_id"],
            subscription_id=d["subscription_id"],
            customer_name=d["customer_name"],
            customer_phone=d["customer_phone"],
            billing_date=date.fromisoformat(d["billing_date"]),
            start_date=date.fromisoformat(d["start_date"]),
            end_date=date.fromisoformat(d["end_date"]),
            items=[InvoiceItem(**item) for item in d["items"]],
            breakdown=InvoiceBreakdown(**d["breakdown"]),
            cancellation_summary=canc,
            status=d["status"],
            created_at=datetime.fromisoformat(d["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(d["updated_at"].replace("Z", "+00:00"))
        )
