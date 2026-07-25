from typing import List, Optional
from datetime import date as DateType
from pydantic import BaseModel, Field

class DailyReportItem(BaseModel):
    date: DateType
    breakfast_count: int
    lunch_count: int
    dinner_count: int
    total_meals: int
    revenue: float
    expenses: float
    collections: float
    profit: float

class FinancialReportSummary(BaseModel):
    start_date: DateType
    end_date: DateType
    total_revenue: float
    total_collections: float
    total_expenses: float
    net_profit: float
    total_pending_balance: float
    items: List[DailyReportItem]
