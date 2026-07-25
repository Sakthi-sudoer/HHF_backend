import uuid
from datetime import date, datetime, timezone
from typing import List, Dict, Any, Optional
from app.models.payment import PaymentCreate, PaymentResponse
from app.models.ledger import CustomerLedgerSummary, LedgerEntry, LedgerEntryType
from app.repositories.payment_repository import PaymentRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.subscription_repository import SubscriptionRepository
from app.services.invoice_engine import InvoiceEngine
from app.core.exceptions import EntityNotFoundException, BusinessRuleViolationException
from app.core.logging import logger

class LedgerEngine:
    def __init__(self):
        self.payment_repo = PaymentRepository()
        self.invoice_repo = InvoiceRepository()
        self.cust_repo = CustomerRepository()
        self.sub_repo = SubscriptionRepository()
        self.invoice_engine = InvoiceEngine()

    def record_payment(self, payload: PaymentCreate) -> PaymentResponse:
        cust = self.cust_repo.get_by_id(payload.customer_id)
        if not cust or cust.get("is_deleted"):
            raise EntityNotFoundException("Customer", payload.customer_id)

        pay_id = f"pay_{uuid.uuid4().hex[:10]}"
        now_dt = datetime.now(timezone.utc)
        receipt_num = f"RCP-{now_dt.strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
        now_str = now_dt.isoformat()

        pay_dict = {
            "id": pay_id,
            "receipt_number": receipt_num,
            "customer_id": payload.customer_id,
            "customer_name": cust.get("name", "Customer"),
            "amount": payload.amount,
            "payment_method": payload.payment_method,
            "payment_date": payload.payment_date.isoformat(),
            "reference_number": payload.reference_number,
            "notes": payload.notes,
            "created_at": now_str
        }

        self.payment_repo.create(pay_id, pay_dict)
        logger.info(f"Recorded payment {receipt_num} of ₹{payload.amount} for customer {cust.get('name', 'Customer')}")
        return self._to_payment_response(pay_dict)

    def get_customer_ledger(self, customer_id: str) -> CustomerLedgerSummary:
        cust = self.cust_repo.get_by_id(customer_id)
        if not cust or cust.get("is_deleted"):
            raise EntityNotFoundException("Customer", customer_id)

        invoices = self.invoice_repo.get_by_customer(customer_id)
        payments = self.payment_repo.get_by_customer(customer_id)

        # Fallback for legacy customer cost & paid fields
        if not invoices and cust.get("cost"):
            legacy_cost = float(cust.get("cost", 0.0))
            legacy_start = str(cust.get("start", date.today().isoformat()))
            invoices = [{
                "id": f"inv_legacy_{customer_id}",
                "invoice_number": f"LEG-INV-{customer_id[-6:]}",
                "billing_date": legacy_start,
                "created_at": f"{legacy_start}T00:00:00+00:00",
                "breakdown": {"net_amount": legacy_cost}
            }]

        if not payments and cust.get("paid"):
            legacy_paid = float(cust.get("paid", 0.0))
            if legacy_paid > 0:
                legacy_start = str(cust.get("start", date.today().isoformat()))
                payments = [{
                    "id": f"pay_legacy_{customer_id}",
                    "receipt_number": f"LEG-RCP-{customer_id[-6:]}",
                    "payment_date": legacy_start,
                    "created_at": f"{legacy_start}T00:00:00+00:00",
                    "payment_method": "cash",
                    "amount": legacy_paid
                }]

        entries: List[LedgerEntry] = []
        running_bal = 0.0
        total_invoiced = 0.0
        total_paid = 0.0

        events = []
        for inv in invoices:
            events.append({
                "type": "invoice",
                "date": inv.get("billing_date", date.today().isoformat()),
                "created_at": inv.get("created_at", datetime.now(timezone.utc).isoformat()),
                "data": inv
            })
        for pay in payments:
            events.append({
                "type": "payment",
                "date": pay.get("payment_date", date.today().isoformat()),
                "created_at": pay.get("created_at", datetime.now(timezone.utc).isoformat()),
                "data": pay
            })

        events.sort(key=lambda x: (x["date"], x["created_at"]))

        now_dt = datetime.now(timezone.utc)
        for ev in events:
            if ev["type"] == "invoice":
                inv = ev["data"]
                amt = inv.get("breakdown", {}).get("net_amount", 0.0)
                if inv.get("cancellation_summary"):
                    amt = inv["cancellation_summary"]["final_adjusted_invoice_total"]
                total_invoiced += amt
                running_bal += amt

                inv_created_at = now_dt
                if inv.get("created_at"):
                    try:
                        inv_created_at = datetime.fromisoformat(str(inv["created_at"]).replace("Z", "+00:00"))
                    except Exception:
                        pass

                entries.append(LedgerEntry(
                    id=inv.get("id", "inv_unk"),
                    date=date.fromisoformat(str(inv.get("billing_date", date.today().isoformat()))),
                    entry_type=LedgerEntryType.INVOICE,
                    customer_id=customer_id,
                    customer_name=cust.get("name", "Customer"),
                    description=f"Invoice #{inv.get('invoice_number', 'INV')}",
                    debit_amount=amt,
                    credit_amount=0.0,
                    running_balance=round(running_bal, 2),
                    reference_id=inv.get("id", "inv_unk"),
                    created_at=inv_created_at
                ))
            elif ev["type"] == "payment":
                pay = ev["data"]
                amt = float(pay.get("amount", 0.0))
                total_paid += amt
                running_bal -= amt

                pay_created_at = now_dt
                if pay.get("created_at"):
                    try:
                        pay_created_at = datetime.fromisoformat(str(pay["created_at"]).replace("Z", "+00:00"))
                    except Exception:
                        pass

                entries.append(LedgerEntry(
                    id=pay.get("id", "pay_unk"),
                    date=date.fromisoformat(str(pay.get("payment_date", date.today().isoformat()))),
                    entry_type=LedgerEntryType.PAYMENT,
                    customer_id=customer_id,
                    customer_name=cust.get("name", "Customer"),
                    description=f"Payment Received ({str(pay.get('payment_method', 'cash')).upper()}) - {pay.get('receipt_number', '')}",
                    debit_amount=0.0,
                    credit_amount=amt,
                    running_balance=round(running_bal, 2),
                    reference_id=pay.get("id", "pay_unk"),
                    created_at=pay_created_at
                ))

        current_balance = round(total_invoiced - total_paid, 2)
        if current_balance <= 0 and total_invoiced > 0:
            p_status = "paid"
        elif current_balance < total_invoiced and total_paid > 0:
            p_status = "partially_paid"
        elif total_paid > total_invoiced:
            p_status = "advance"
        else:
            p_status = "overdue" if total_invoiced > 0 else "paid"

        active_sub = self.sub_repo.get_active_by_customer(customer_id)
        active_inv_res = None
        if active_sub:
            latest_inv_dict = self.invoice_repo.get_latest_invoice_for_subscription(active_sub["id"])
            if latest_inv_dict:
                active_inv_res = self.invoice_engine._to_response(latest_inv_dict)

        recent_pay_res = [self._to_payment_response(p) for p in payments[-5:]]

        return CustomerLedgerSummary(
            customer_id=customer_id,
            customer_name=cust.get("name", "Customer"),
            customer_phone=cust.get("phone", "N/A"),
            total_invoiced=round(total_invoiced, 2),
            total_paid=round(total_paid, 2),
            current_balance=current_balance,
            payment_status=p_status,
            entries=entries,
            active_invoice=active_inv_res,
            recent_payments=recent_pay_res
        )

    def _to_payment_response(self, d: Dict[str, Any]) -> PaymentResponse:
        now_dt = datetime.now(timezone.utc)
        created_at = now_dt
        if d.get("created_at"):
            try:
                created_at = datetime.fromisoformat(str(d["created_at"]).replace("Z", "+00:00"))
            except Exception:
                pass

        try:
            pay_date = date.fromisoformat(str(d.get("payment_date")))
        except Exception:
            pay_date = date.today()

        return PaymentResponse(
            id=d.get("id", "pay_unk"),
            receipt_number=d.get("receipt_number", "RCP"),
            customer_id=d.get("customer_id", "cust_unk"),
            customer_name=d.get("customer_name", "Customer"),
            amount=float(d.get("amount", 0.0)),
            payment_method=d.get("payment_method", "cash"),
            payment_date=pay_date,
            reference_number=d.get("reference_number"),
            notes=d.get("notes"),
            created_at=created_at
        )
