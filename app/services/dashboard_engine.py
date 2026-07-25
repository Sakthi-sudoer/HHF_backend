import time
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
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

# Fast 10-second TTL Cache for Dashboard queries
_DASHBOARD_CACHE: Dict[str, Any] = {}
_DASHBOARD_CACHE_TTL = 10  # seconds

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
        
        # 1. Operational Stats for Today (Fast in-memory aggregation without blocking writes)
        active_subs = self.sub_repo.get_all_active_subscriptions()
        existing_today_deliveries = self.delivery_repo.get_by_date(today_str)
        existing_deliv_map = {d["customer_id"]: d for d in existing_today_deliveries}

        global_s = self.settings_service.get_settings()
        is_sunday = today_d.weekday() == 6
        is_delivery_day = not (is_sunday and global_s.sunday_holiday_enabled)

        b_veg, b_non, l_veg, l_non, d_veg, d_non = 0, 0, 0, 0, 0, 0

        for sub in active_subs:
            sub_start = date.fromisoformat(sub["start_date"])
            sub_end = date.fromisoformat(sub["end_date"])

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
                    meals_cfg = sub["meals"]
                    prefs_cfg = sub["preferences"]
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
        total_m = b_stats.total + l_stats.total + d_stats.total

        ops = OperationsTodayStats(
            date=today_d,
            breakfast=b_stats,
            lunch=l_stats,
            dinner=d_stats,
            total_meals=total_m
        )

        # 2. Financial Date Range Resolver
        if period == "today":
            p_start, p_end = today_d, today_d
        elif period == "this_week":
            p_start = today_d - timedelta(days=today_d.weekday())
            p_end = today_d
        elif period == "this_month":
            p_start = today_d.replace(day=1)
            p_end = today_d
        elif period == "custom" and start_date and end_date:
            p_start, p_end = start_date, end_date
        else:
            p_start, p_end = today_d, today_d

        p_start_str, p_end_str = p_start.isoformat(), p_end.isoformat()

        # Bulk fetch collections (4 single network calls total)
        all_payments = self.payment_repo.list_all()
        all_expenses = self.expense_repo.list_all()
        all_invoices = self.invoice_repo.list_all()
        active_custs = self.cust_repo.get_active_customers()
        active_cust_ids = {c["id"] for c in active_custs}

        # Collections & Expenses in period
        period_collections = sum(
            p.get("amount", 0.0) for p in all_payments 
            if p_start_str <= p.get("payment_date", "") <= p_end_str
        )
        period_expenses = sum(
            e.get("amount", 0.0) for e in all_expenses 
            if p_start_str <= e.get("date", "") <= p_end_str
        )

        # Revenue in period
        period_revenue = sum(
            (inv.get("cancellation_summary", {}).get("final_adjusted_invoice_total") 
             if inv.get("cancellation_summary") else inv.get("breakdown", {}).get("net_amount", 0.0))
            for inv in all_invoices if p_start_str <= inv.get("billing_date", "") <= p_end_str
        )

        # FAST IN-MEMORY PENDING BALANCE CALCULATION
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
                cust_paid[c_id] = cust_paid.get(c_id, 0.0) + p.get("amount", 0.0)

        total_pending = 0.0
        for c_id in active_cust_ids:
            bal = cust_invoiced.get(c_id, 0.0) - cust_paid.get(c_id, 0.0)
            if bal > 0:
                total_pending += bal

        profit = round(period_revenue - period_expenses, 2)

        financials = FinancialCardsStats(
            period=period,
            todays_collection=round(period_collections, 2),
            pending_amount=round(total_pending, 2),
            todays_revenue=round(period_revenue, 2),
            total_expenses=round(period_expenses, 2),
            profit=profit
        )

        paused_custs = self.cust_repo.list_all(filters=[("status", "==", "paused"), ("is_deleted", "==", False)])

        response = DashboardSummaryResponse(
            operations=ops,
            financials=financials,
            active_customers_count=len(active_custs),
            paused_customers_count=len(paused_custs)
        )

        # Save to fast TTL cache
        _DASHBOARD_CACHE[cache_key] = (response, time.time())
        return response

def invalidate_dashboard_cache():
    global _DASHBOARD_CACHE
    _DASHBOARD_CACHE.clear()
