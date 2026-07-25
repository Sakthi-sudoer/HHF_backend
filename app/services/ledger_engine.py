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
            "customer_name": cust["name"],
            "amount": payload.amount,
            "payment_method": payload.payment_method,
            "payment_date": payload.payment_date.isoformat(),
            "reference_number": payload.reference_number,
            "notes": payload.notes,
            "created_at": now_str
        }

        self.payment_repo.create(pay_id, pay_dict)
        logger.info(f"Recorded payment {receipt_num} of ₹{payload.amount} for customer {cust['name']}")
        return self._to_payment_response(pay_dict)

    def get_customer_ledger(self, customer_id: str) -> CustomerLedgerSummary:
        cust = self.cust_repo.get_by_id(customer_id)
        if not cust or cust.get("is_deleted"):
            raise EntityNotFoundException("Customer", customer_id)

        invoices = self.invoice_repo.get_by_customer(customer_id)
        payments = self.payment_repo.get_by_customer(customer_id)

        entries: List[LedgerEntry] = []
        running_bal = 0.0
        total_invoiced = 0.0
        total_paid = 0.0

        events = []
        for inv in invoices:
            events.append({
                "type": "invoice",
                "date": inv["billing_date"],
                "created_at": inv["created_at"],
                "data": inv
            })
        for pay in payments:
            events.append({
                "type": "payment",
                "date": pay["payment_date"],
                "created_at": pay["created_at"],
                "data": pay
            })

        events.sort(key=lambda x: (x["date"], x["created_at"]))

        for ev in events:
            if ev["type"] == "invoice":
                inv = ev["data"]
                amt = inv["breakdown"]["net_amount"]
                if inv.get("cancellation_summary"):
                    amt = inv["cancellation_summary"]["final_adjusted_invoice_total"]
                total_invoiced += amt
                running_bal += amt
                entries.append(LedgerEntry(
                    id=inv["id"],
                    date=date.fromisoformat(inv["billing_date"]),
                    entry_type=LedgerEntryType.INVOICE,
                    customer_id=customer_id,
                    customer_name=cust["name"],
                    description=f"Invoice #{inv['invoice_number']}",
                    debit_amount=amt,
                    credit_amount=0.0,
                    running_balance=round(running_bal, 2),
                    reference_id=inv["id"],
                    created_at=datetime.fromisoformat(inv["created_at"].replace("Z", "+00:00"))
                ))
            elif ev["type"] == "payment":
                pay = ev["data"]
                amt = pay["amount"]
                total_paid += amt
                running_bal -= amt
                entries.append(LedgerEntry(
                    id=pay["id"],
                    date=date.fromisoformat(pay["payment_date"]),
                    entry_type=LedgerEntryType.PAYMENT,
                    customer_id=customer_id,
                    customer_name=cust["name"],
                    description=f"Payment Received ({pay['payment_method'].upper()}) - {pay.get('receipt_number', '')}",
                    debit_amount=0.0,
                    credit_amount=amt,
                    running_balance=round(running_bal, 2),
                    reference_id=pay["id"],
                    created_at=datetime.fromisoformat(pay["created_at"].replace("Z", "+00:00"))
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
            customer_name=cust["name"],
            customer_phone=cust["phone"],
            total_invoiced=round(total_invoiced, 2),
            total_paid=round(total_paid, 2),
            current_balance=current_balance,
            payment_status=p_status,
            entries=entries,
            active_invoice=active_inv_res,
            recent_payments=recent_pay_res
        )

    def _to_payment_response(self, d: Dict[str, Any]) -> PaymentResponse:
        return PaymentResponse(
            id=d["id"],
            receipt_number=d["receipt_number"],
            customer_id=d["customer_id"],
            customer_name=d["customer_name"],
            amount=d["amount"],
            payment_method=d["payment_method"],
            payment_date=date.fromisoformat(d["payment_date"]),
            reference_number=d.get("reference_number"),
            notes=d.get("notes"),
            created_at=datetime.fromisoformat(d["created_at"].replace("Z", "+00:00"))
        )
