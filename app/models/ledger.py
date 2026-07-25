from typing import List, Optional
from datetime import date as DateType, datetime
from pydantic import BaseModel, Field
from app.models.payment import PaymentResponse
from app.models.invoice import InvoiceResponse

class LedgerEntryType(str):
    INVOICE = "invoice"
    PAYMENT = "payment"
    ADJUSTMENT = "adjustment"
    REFUND = "refund"

class LedgerEntry(BaseModel):
    id: str
    date: DateType
    entry_type: str
    customer_id: str
    customer_name: str
    description: str
    debit_amount: float = Field(0.0, description="Amount billed to customer (Invoice)")
    credit_amount: float = Field(0.0, description="Amount paid by customer (Payment)")
    running_balance: float = Field(..., description="Post-transaction outstanding balance")
    reference_id: str = Field(..., description="Associated Invoice or Payment ID")
    created_at: datetime

class CustomerLedgerSummary(BaseModel):
    customer_id: str
    customer_name: str
    customer_phone: str
    total_invoiced: float
    total_paid: float
    current_balance: float
    payment_status: str = Field(..., description="'paid', 'partially_paid', 'overdue', 'advance'")
    entries: List[LedgerEntry]
    active_invoice: Optional[InvoiceResponse] = None
    recent_payments: List[PaymentResponse] = []
