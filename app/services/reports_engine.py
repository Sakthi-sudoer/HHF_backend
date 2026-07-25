import io
from datetime import date, timedelta, datetime, timezone
from typing import List, Dict, Any, Optional
import pandas as pd
from app.models.reports import (
    FullReportDataResponse, ReportsSummaryResponse, InvoiceReportItem,
    CollectionReportItem, OutstandingReportItem, PaymentModeBreakdownItem,
    SubscriptionStatusReportItem, MonthlyRevenueItem
)
from app.repositories.delivery_repository import DeliveryRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.subscription_repository import SubscriptionRepository
from app.services.ledger_engine import LedgerEngine

class ReportsEngine:
    def __init__(self):
        self.delivery_repo = DeliveryRepository()
        self.invoice_repo = InvoiceRepository()
        self.expense_repo = ExpenseRepository()
        self.payment_repo = PaymentRepository()
        self.cust_repo = CustomerRepository()
        self.sub_repo = SubscriptionRepository()
        self.ledger_engine = LedgerEngine()

    def generate_full_report_data(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        customer_id: Optional[str] = None,
        payment_status: Optional[str] = None,
        payment_mode: Optional[str] = None,
        subscription_type: Optional[str] = None
    ) -> FullReportDataResponse:
        all_invoices = self.invoice_repo.list_all()
        all_payments = self.payment_repo.list_all()
        all_expenses = self.expense_repo.list_all()
        all_subs = self.sub_repo.list_all()
        active_custs = self.cust_repo.get_active_customers()

        # Date Filtering
        if start_date and end_date:
            all_invoices = [inv for inv in all_invoices if start_date <= date.fromisoformat(str(inv.get("billing_date", date.today().isoformat()))) <= end_date]
            all_payments = [pay for pay in all_payments if start_date <= date.fromisoformat(str(pay.get("payment_date", date.today().isoformat()))) <= end_date]
            all_expenses = [exp for exp in all_expenses if start_date <= date.fromisoformat(str(exp.get("date", date.today().isoformat()))) <= end_date]

        # Customer Filtering
        if customer_id:
            all_invoices = [inv for inv in all_invoices if inv.get("customer_id") == customer_id]
            all_payments = [pay for pay in all_payments if pay.get("customer_id") == customer_id]
            all_subs = [s for s in all_subs if s.get("customer_id") == customer_id]
            active_custs = [c for c in active_custs if c.get("id") == customer_id]

        # 1. Invoice Report Items
        inv_items: List[InvoiceReportItem] = []
        tot_revenue = 0.0
        for inv in all_invoices:
            amt = inv.get("breakdown", {}).get("net_amount", 0.0)
            if inv.get("cancellation_summary"):
                amt = inv["cancellation_summary"]["final_adjusted_invoice_total"]
            tot_revenue += amt

            inv_status = str(inv.get("status", "issued")).lower()
            if payment_status and inv_status != payment_status.lower():
                continue

            inv_items.append(InvoiceReportItem(
                invoice_number=inv.get("invoice_number", "INV"),
                customer_name=inv.get("customer_name", "Customer"),
                customer_phone=inv.get("customer_phone", "N/A"),
                billing_date=date.fromisoformat(str(inv.get("billing_date", date.today().isoformat()))),
                start_date=date.fromisoformat(str(inv.get("start_date", date.today().isoformat()))),
                end_date=date.fromisoformat(str(inv.get("end_date", date.today().isoformat()))),
                net_amount=round(amt, 2),
                status=inv_status
            ))

        # 2. Collection Report Items & Payment Mode Breakdown
        coll_items: List[CollectionReportItem] = []
        mode_counts: Dict[str, Dict[str, float]] = {}
        tot_collections = 0.0

        for pay in all_payments:
            pmode = str(pay.get("payment_method", "cash")).lower()
            if payment_mode and pmode != payment_mode.lower():
                continue

            amt = float(pay.get("amount", 0.0))
            tot_collections += amt

            if pmode not in mode_counts:
                mode_counts[pmode] = {"count": 0, "amount": 0.0}
            mode_counts[pmode]["count"] += 1
            mode_counts[pmode]["amount"] += amt

            coll_items.append(CollectionReportItem(
                receipt_number=pay.get("receipt_number", "RCP"),
                payment_date=date.fromisoformat(str(pay.get("payment_date", date.today().isoformat()))),
                customer_name=pay.get("customer_name", "Customer"),
                amount=round(amt, 2),
                payment_method=pmode.upper(),
                reference_number=pay.get("reference_number")
            ))

        pmode_items = [
            PaymentModeBreakdownItem(payment_method=k.upper(), count=v["count"], total_amount=round(v["amount"], 2))
            for k, v in mode_counts.items()
        ]

        # 3. Outstanding Report
        out_items: List[OutstandingReportItem] = []
        tot_outstanding = 0.0
        for cust in active_custs:
            try:
                ledger_sum = self.ledger_engine.get_customer_ledger(cust["id"])
                tot_outstanding += ledger_sum.current_balance
                out_items.append(OutstandingReportItem(
                    customer_id=cust["id"],
                    customer_name=cust.get("name", "Customer"),
                    customer_phone=cust.get("phone", "N/A"),
                    total_invoiced=ledger_sum.total_invoiced,
                    total_paid=ledger_sum.total_paid,
                    outstanding_balance=ledger_sum.current_balance,
                    payment_status=ledger_sum.payment_status
                ))
            except Exception:
                pass

        # 4. Subscription Report
        sub_items: List[SubscriptionStatusReportItem] = []
        today = date.today()
        for sub in all_subs:
            stype = str(sub.get("subscription_type", "monthly")).lower()
            if subscription_type and stype != subscription_type.lower():
                continue
            
            end_d = date.fromisoformat(str(sub.get("end_date", today.isoformat())))
            days_rem = (end_d - today).days

            sub_items.append(SubscriptionStatusReportItem(
                subscription_id=sub.get("id", "sub_unk"),
                customer_name=sub.get("customer_name", cust_repo_name(sub.get("customer_id"), active_custs)),
                subscription_type=stype,
                start_date=date.fromisoformat(str(sub.get("start_date", today.isoformat()))),
                end_date=end_d,
                status=str(sub.get("status", "active")),
                days_remaining=days_rem
            ))

        # 5. Expenses & Monthly Revenue
        tot_expenses = sum(float(e.get("amount", 0.0)) for e in all_expenses if not e.get("is_deleted"))
        net_profit = round(tot_revenue - tot_expenses, 2)

        m_rev_map: Dict[str, Dict[str, float]] = {}
        for inv in all_invoices:
            b_date = str(inv.get("billing_date", today.isoformat()))[:7]
            amt = inv.get("breakdown", {}).get("net_amount", 0.0)
            if b_date not in m_rev_map:
                m_rev_map[b_date] = {"revenue": 0.0, "collected": 0.0, "expenses": 0.0}
            m_rev_map[b_date]["revenue"] += amt

        for pay in all_payments:
            p_date = str(pay.get("payment_date", today.isoformat()))[:7]
            amt = float(pay.get("amount", 0.0))
            if p_date not in m_rev_map:
                m_rev_map[p_date] = {"revenue": 0.0, "collected": 0.0, "expenses": 0.0}
            m_rev_map[p_date]["collected"] += amt

        for exp in all_expenses:
            e_date = str(exp.get("date", today.isoformat()))[:7]
            amt = float(exp.get("amount", 0.0))
            if e_date not in m_rev_map:
                m_rev_map[e_date] = {"revenue": 0.0, "collected": 0.0, "expenses": 0.0}
            m_rev_map[e_date]["expenses"] += amt

        m_rev_items = [
            MonthlyRevenueItem(
                month=k,
                total_revenue=round(v["revenue"], 2),
                total_collected=round(v["collected"], 2),
                total_expenses=round(v["expenses"], 2),
                net_profit=round(v["revenue"] - v["expenses"], 2)
            )
            for k, v in sorted(m_rev_map.items())
        ]

        summary = ReportsSummaryResponse(
            total_revenue=round(tot_revenue, 2),
            total_collections=round(tot_collections, 2),
            total_outstanding=round(tot_outstanding, 2),
            total_expenses=round(tot_expenses, 2),
            net_profit=net_profit,
            invoices_count=len(inv_items),
            payments_count=len(coll_items),
            active_subscriptions_count=len(sub_items)
        )

        return FullReportDataResponse(
            summary=summary,
            invoices=inv_items,
            collections=coll_items,
            outstanding=out_items,
            payment_modes=pmode_items,
            subscriptions=sub_items,
            monthly_revenue=m_rev_items
        )

    def export_report_csv(self, start_date: Optional[date] = None, end_date: Optional[date] = None) -> str:
        rep_data = self.generate_full_report_data(start_date, end_date)
        inv_df = pd.DataFrame([i.model_dump() for i in rep_data.invoices])
        return inv_df.to_csv(index=False)

def cust_repo_name(c_id: Optional[str], active_custs: List[Dict[str, Any]]) -> str:
    if not c_id:
        return "Customer"
    for c in active_custs:
        if c.get("id") == c_id:
            return c.get("name", "Customer")
    return "Customer"
