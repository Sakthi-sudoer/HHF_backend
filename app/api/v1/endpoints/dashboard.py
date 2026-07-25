from datetime import date
from typing import Optional
from fastapi import APIRouter, Query
from app.models.response import ApiResponse
from app.models.dashboard import DashboardSummaryResponse
from app.services.dashboard_engine import DashboardEngine

router = APIRouter(prefix="/dashboard", tags=["Dashboard Engine"])
engine = DashboardEngine()

@router.get("", response_model=ApiResponse[DashboardSummaryResponse], summary="Get dashboard operations & financial stats")
def get_dashboard_summary(
    period: str = Query("today", description="Financial filter: 'today', 'this_week', 'this_month', 'custom'"),
    start_date: Optional[date] = Query(None, description="Start date if period is 'custom'"),
    end_date: Optional[date] = Query(None, description="End date if period is 'custom'")
):
    """
    Fetches real-time dashboard data including:
    - Today's Meal Operational Counts (Breakfast, Lunch, Dinner with Veg/Non-Veg breakdown)
    - Financial Summary Cards (Today's Collection, Pending Amount, Today's Revenue, Total Expenses, Profit = Revenue - Expenses)
    - Active vs Paused customer counts.
    """
    result = engine.get_dashboard_summary(period=period, start_date=start_date, end_date=end_date)
    return ApiResponse.ok(data=result, message="Dashboard metrics calculated successfully")
