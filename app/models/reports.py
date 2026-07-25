from typing import Optional, List, Dict, Any
from datetime import date as DateType, datetime
from pydantic import BaseModel, Field

class InvoiceReportItem(BaseModel):
    invoice_number: str
    customer_name: str
    customer_phone: str
    billing_date: DateType
    start_date: DateType
    end_date: DateType
    net_amount: float
    status: str

class CollectionReportItem(BaseModel):
    receipt_number: str
    payment_date: DateType
    customer_name: str
    amount: float
    payment_method: str
    reference_number: Optional[str]

class OutstandingReportItem(BaseModel):
    customer_id: str
    customer_name: str
    customer_phone: str
    total_invoiced: float
    total_paid: float
    outstanding_balance: float
    payment_status: str

class PaymentModeBreakdownItem(BaseModel):
    payment_method: str
    count: int
    total_amount: float

class SubscriptionStatusReportItem(BaseModel):
    subscription_id: str
    customer_name: str
    subscription_type: str
    start_date: DateType
    end_date: DateType
    status: str
    days_remaining: int

class MonthlyRevenueItem(BaseModel):
    month: str
    total_revenue: float
    total_collected: float
    total_expenses: float
    net_profit: float

class ReportsSummaryResponse(BaseModel):
    total_revenue: float
    total_collections: float
    total_outstanding: float
    total_expenses: float
    net_profit: float
    invoices_count: int
    payments_count: int
    active_subscriptions_count: int

class FullReportDataResponse(BaseModel):
    summary: ReportsSummaryResponse
    invoices: List[InvoiceReportItem]
    collections: List[CollectionReportItem]
    outstanding: List[OutstandingReportItem]
    payment_modes: List[PaymentModeBreakdownItem]
    subscriptions: List[SubscriptionStatusReportItem]
    monthly_revenue: List[MonthlyRevenueItem]
