import io
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
import pandas as pd
from app.models.reports import FinancialReportSummary, DailyReportItem
from app.repositories.delivery_repository import DeliveryRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.customer_repository import CustomerRepository
from app.services.ledger_engine import LedgerEngine

class ReportsEngine:
    def __init__(self):
        self.delivery_repo = DeliveryRepository()
        self.invoice_repo = InvoiceRepository()
        self.expense_repo = ExpenseRepository()
        self.payment_repo = PaymentRepository()
        self.cust_repo = CustomerRepository()

    def generate_financial_report(self, start_date: date, end_date: date) -> FinancialReportSummary:
        curr = start_date
        items: List[DailyReportItem] = []
        tot_rev, tot_coll, tot_exp = 0.0, 0.0, 0.0

        all_deliveries = self.delivery_repo.list_all()
        all_invoices = self.invoice_repo.list_all()
        all_expenses = self.expense_repo.list_all()
        all_payments = self.payment_repo.list_all()

        while curr <= end_date:
            curr_str = curr.isoformat()
            
            # Count meals for day
            day_dels = [d for d in all_deliveries if d.get("date") == curr_str]
            b_cnt = sum(1 for d in day_dels if d.get("breakfast", {}).get("delivered"))
            l_cnt = sum(1 for d in day_dels if d.get("lunch", {}).get("delivered"))
            d_cnt = sum(1 for d in day_dels if d.get("dinner", {}).get("delivered"))

            day_rev = sum(
                (inv.get("cancellation_summary", {}).get("final_adjusted_invoice_total") 
                 if inv.get("cancellation_summary") else inv.get("breakdown", {}).get("net_amount", 0.0))
                for inv in all_invoices if inv.get("billing_date") == curr_str
            )
            day_exp = sum(e.get("amount", 0.0) for e in all_expenses if e.get("date") == curr_str)
            day_coll = sum(p.get("amount", 0.0) for p in all_payments if p.get("payment_date") == curr_str)

            tot_rev += day_rev
            tot_exp += day_exp
            tot_coll += day_coll

            items.append(DailyReportItem(
                date=curr,
                breakfast_count=b_cnt,
                lunch_count=l_cnt,
                dinner_count=d_cnt,
                total_meals=b_cnt + l_cnt + d_cnt,
                revenue=round(day_rev, 2),
                expenses=round(day_exp, 2),
                collections=round(day_coll, 2),
                profit=round(day_rev - day_exp, 2)
            ))
            curr += timedelta(days=1)

        # Pending balance across all active customers
        ledger_engine = LedgerEngine()
        active_custs = self.cust_repo.get_active_customers()
        tot_pending = sum(ledger_engine.get_customer_ledger(c["id"]).current_balance for c in active_custs)

        return FinancialReportSummary(
            start_date=start_date,
            end_date=end_date,
            total_revenue=round(tot_rev, 2),
            total_collections=round(tot_coll, 2),
            total_expenses=round(tot_exp, 2),
            net_profit=round(tot_rev - tot_exp, 2),
            total_pending_balance=round(tot_pending, 2),
            items=items
        )

    def export_report_csv(self, start_date: date, end_date: date) -> str:
        report = self.generate_financial_report(start_date, end_date)
        data = [item.model_dump() for item in report.items]
        df = pd.DataFrame(data)
        return df.to_csv(index=False)
