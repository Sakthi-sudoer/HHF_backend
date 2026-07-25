import time
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
from concurrent.futures import ThreadPoolExecutor
from app.models.dashboard import (
    DashboardSummaryResponse, OperationsTodayStats, MealTypeStats, FinancialCardsStats
)
from app.repositories.delivery_repository import DeliveryRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.subscription_repository import SubscriptionRepository
from app.services.settings_service import SettingsService

_DASHBOARD_CACHE: Dict[str, Any] = {}
_DASHBOARD_CACHE_TTL = 30  # 30s TTL for fast loading

class DashboardEngine:
    def __init__(self):
        self.delivery_repo = DeliveryRepository()
        self.cust_repo = CustomerRepository()
        self.payment_repo = PaymentRepository()
        self.expense_repo = ExpenseRepository()
        self.invoice_repo = InvoiceRepository()
        self.sub_repo = SubscriptionRepository()
        self.settings_service = SettingsService()

    def get_dashboard_summary(
        self, 
        period: str = "today", 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> DashboardSummaryResponse:
        cache_key = f"{period}_{start_date}_{end_date}"
        now_time = time.time()

        if cache_key in _DASHBOARD_CACHE:
            cached_data, cached_at = _DASHBOARD_CACHE[cache_key]
            if now_time - cached_at < _DASHBOARD_CACHE_TTL:
                return cached_data

        today_d = date.today()
        today_str = today_d.isoformat()
        month_start_str = today_d.replace(day=1).isoformat()

        # Parallel Firestore queries
        with ThreadPoolExecutor(max_workers=6) as executor:
            fut_subs = executor.submit(self.sub_repo.get_all_active_subscriptions)
            fut_delivs = executor.submit(self.delivery_repo.get_by_date, today_str)
            fut_payments = executor.submit(self.payment_repo.list_all)
            fut_expenses = executor.submit(self.expense_repo.list_all)
            fut_invoices = executor.submit(self.invoice_repo.list_all)
            fut_custs = executor.submit(self.cust_repo.get_active_customers)

            active_subs = fut_subs.result()
            existing_today_deliveries = fut_delivs.result()
            all_payments = fut_payments.result()
            all_expenses = fut_expenses.result()
            all_invoices = fut_invoices.result()
            active_custs = fut_custs.result()

        existing_deliv_map = {d["customer_id"]: d for d in existing_today_deliveries}

        global_s = self.settings_service.get_settings()
        is_sunday = today_d.weekday() == 6
        is_delivery_day = not (is_sunday and global_s.sunday_holiday_enabled)

        b_veg, b_non, l_veg, l_non, d_veg, d_non = 0, 0, 0, 0, 0, 0

        for sub in active_subs:
            try:
                sub_start = date.fromisoformat(str(sub["start_date"]))
                sub_end = date.fromisoformat(str(sub["end_date"]))
            except Exception:
                continue

            if sub_start <= today_d <= sub_end:
                c_id = sub["customer_id"]
                if c_id in existing_deliv_map:
                    deliv = existing_deliv_map[c_id]
                    if deliv.get("breakfast", {}).get("delivered"):
                        if deliv.get("breakfast", {}).get("preference") == "veg":
                            b_veg += 1
                        else:
                            b_non += 1
                    if deliv.get("lunch", {}).get("delivered"):
                        if deliv.get("lunch", {}).get("preference") == "veg":
                            l_veg += 1
                        else:
                            l_non += 1
                    if deliv.get("dinner", {}).get("delivered"):
                        if deliv.get("dinner", {}).get("preference") == "veg":
                            d_veg += 1
                        else:
                            d_non += 1
                elif is_delivery_day:
                    meals_cfg = sub.get("meals", {"breakfast": True, "lunch": True, "dinner": True})
                    prefs_cfg = sub.get("preferences", {"breakfast": "veg", "lunch": "veg", "dinner": "veg"})
                    if meals_cfg.get("breakfast"):
                        if prefs_cfg.get("breakfast") == "veg":
                            b_veg += 1
                        else:
                            b_non += 1
                    if meals_cfg.get("lunch"):
                        if prefs_cfg.get("lunch") == "veg":
                            l_veg += 1
                        else:
                            l_non += 1
                    if meals_cfg.get("dinner"):
                        if prefs_cfg.get("dinner") == "veg":
                            d_veg += 1
                        else:
                            d_non += 1

        b_stats = MealTypeStats(veg=b_veg, non_veg=b_non, total=b_veg + b_non)
        l_stats = MealTypeStats(veg=l_veg, non_veg=l_non, total=l_veg + l_non)
        d_stats = MealTypeStats(veg=d_veg, non_veg=d_non, total=d_veg + d_non)

        ops = OperationsTodayStats(
            date=today_d,
            breakfast=b_stats,
            lunch=l_stats,
            dinner=d_stats,
            total_meals=b_stats.total + l_stats.total + d_stats.total
        )

        active_cust_ids = {c["id"] for c in active_custs}

        # Calculations
        today_coll = sum(float(p.get("amount", 0.0)) for p in all_payments if p.get("payment_date") == today_str)
        month_coll = sum(float(p.get("amount", 0.0)) for p in all_payments if p.get("payment_date", "") >= month_start_str)
        today_pay_count = sum(1 for p in all_payments if p.get("payment_date") == today_str)

        today_invs = [i for i in all_invoices if i.get("billing_date") == today_str]
        today_inv_count = len(today_invs)
        today_inv_amt = sum(
            (i.get("cancellation_summary", {}).get("final_adjusted_invoice_total") 
             if i.get("cancellation_summary") else i.get("breakdown", {}).get("net_amount", 0.0))
            for i in today_invs
        )

        month_rev = sum(
            (i.get("cancellation_summary", {}).get("final_adjusted_invoice_total") 
             if i.get("cancellation_summary") else i.get("breakdown", {}).get("net_amount", 0.0))
            for i in all_invoices if i.get("billing_date", "") >= month_start_str
        )
        month_exp = sum(float(e.get("amount", 0.0)) for e in all_expenses if e.get("date", "") >= month_start_str and not e.get("is_deleted"))

        # Outstanding balances calculation
        cust_invoiced: Dict[str, float] = {}
        for inv in all_invoices:
            c_id = inv.get("customer_id")
            if c_id in active_cust_ids:
                amt = (inv.get("cancellation_summary", {}).get("final_adjusted_invoice_total") 
                       if inv.get("cancellation_summary") else inv.get("breakdown", {}).get("net_amount", 0.0))
                cust_invoiced[c_id] = cust_invoiced.get(c_id, 0.0) + amt

        cust_paid: Dict[str, float] = {}
        for p in all_payments:
            c_id = p.get("customer_id")
            if c_id in active_cust_ids:
                cust_paid[c_id] = cust_paid.get(c_id, 0.0) + float(p.get("amount", 0.0))

        tot_out = 0.0
        for c_id in active_cust_ids:
            bal = cust_invoiced.get(c_id, 0.0) - cust_paid.get(c_id, 0.0)
            if bal > 0:
                tot_out += bal

        expiring_cnt = 0
        for sub in active_subs:
            try:
                e_d = date.fromisoformat(str(sub["end_date"]))
                if 0 <= (e_d - today_d).days <= 7:
                    expiring_cnt += 1
            except Exception:
                pass

        month_prof = round(month_rev - month_exp, 2)

        financials = FinancialCardsStats(
            period=period,
            todays_collection=round(today_coll, 2),
            monthly_collection=round(month_coll, 2),
            pending_collection=round(tot_out, 2),
            total_outstanding=round(tot_out, 2),
            pending_amount=round(tot_out, 2),
            today_new_invoices_count=today_inv_count,
            today_new_invoices_amount=round(today_inv_amt, 2),
            today_payments_count=today_pay_count,
            monthly_revenue=round(month_rev, 2),
            monthly_profit=month_prof,
            todays_revenue=round(month_rev, 2),
            total_expenses=round(month_exp, 2),
            profit=month_prof,
            active_subscriptions_count=len(active_subs),
            expiring_subscriptions_count=expiring_cnt
        )

        paused_custs = [c for c in active_custs if c.get("status") == "paused"]

        response = DashboardSummaryResponse(
            operations=ops,
            financials=financials,
            active_customers_count=len(active_custs),
            paused_customers_count=len(paused_custs)
        )

        _DASHBOARD_CACHE[cache_key] = (response, time.time())
        return response

def invalidate_dashboard_cache():
    global _DASHBOARD_CACHE
    _DASHBOARD_CACHE.clear()
