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
    todays_collection: float = Field(0.0, description="Total payments received today")
    monthly_collection: float = Field(0.0, description="Total collections this month")
    pending_collection: float = Field(0.0, description="Total pending collections")
    total_outstanding: float = Field(0.0, description="Total outstanding uncollected balance across all active customers")
    pending_amount: float = Field(0.0, description="Legacy pending amount alias")
    today_new_invoices_count: int = Field(0, description="Invoices generated today")
    today_new_invoices_amount: float = Field(0.0, description="Total amount of new invoices today")
    today_payments_count: int = Field(0, description="Number of payments recorded today")
    monthly_revenue: float = Field(0.0, description="Accrued revenue for this month")
    monthly_profit: float = Field(0.0, description="Monthly Revenue - Monthly Expenses = Net Profit")
    todays_revenue: float = Field(0.0, description="Revenue for period")
    total_expenses: float = Field(0.0, description="Total expenses recorded in period")
    profit: float = Field(0.0, description="Period Profit")
    active_subscriptions_count: int = Field(0, description="Active subscription count")
    expiring_subscriptions_count: int = Field(0, description="Subscriptions expiring in <= 7 days")

class DashboardSummaryResponse(BaseModel):
    operations: OperationsTodayStats
    financials: FinancialCardsStats
    active_customers_count: int
    paused_customers_count: int
