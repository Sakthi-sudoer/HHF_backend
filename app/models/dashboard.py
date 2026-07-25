from typing import List, Optional
from datetime import date as DateType
from pydantic import BaseModel, Field

class MealTypeStats(BaseModel):
    veg: int = 0
    non_veg: int = 0
    total: int = 0

class OperationsTodayStats(BaseModel):
    date: DateType
    breakfast: MealTypeStats
    lunch: MealTypeStats
    dinner: MealTypeStats
    total_meals: int

class FinancialCardsStats(BaseModel):
    period: str = Field(..., description="'today', 'this_week', 'this_month', 'custom'")
    todays_collection: float = Field(0.0, description="Total payments received in period")
    pending_amount: float = Field(0.0, description="Total outstanding uncollected balance across all active customers")
    todays_revenue: float = Field(0.0, description="Accrued meal revenue for period")
    total_expenses: float = Field(0.0, description="Total expenses recorded in period")
    profit: float = Field(0.0, description="Revenue - Expenses = Profit")

class DashboardSummaryResponse(BaseModel):
    operations: OperationsTodayStats
    financials: FinancialCardsStats
    active_customers_count: int
    paused_customers_count: int
