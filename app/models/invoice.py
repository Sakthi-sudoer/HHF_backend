from typing import Optional, List
from datetime import date as DateType, datetime
from pydantic import BaseModel, Field

class InvoiceItem(BaseModel):
    description: str
    quantity: int
    unit_price: float
    total_price: float

class InvoiceBreakdown(BaseModel):
    breakfast_total: float
    lunch_total: float
    dinner_total: float
    delivery_total: float
    gross_amount: float
    discount_amount: float = 0.0
    net_amount: float

class InvoiceCancellationSummary(BaseModel):
    original_invoice_total: float
    consumed_amount: float
    unused_meals_credit: float
    delivery_adjustment: float
    final_adjusted_invoice_total: float
    total_paid: float
    pending_balance: float
    refund_due: float

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    customer_id: str
    subscription_id: str
    customer_name: str
    customer_phone: str
    billing_date: DateType
    start_date: DateType
    end_date: DateType
    items: List[InvoiceItem]
    breakdown: InvoiceBreakdown
    cancellation_summary: Optional[InvoiceCancellationSummary] = None
    status: str = Field("issued", description="'issued', 'partially_paid', 'paid', 'cancelled', 'adjusted'")
    created_at: datetime
    updated_at: datetime
