from typing import Optional, List
from datetime import date as DateType, datetime
from pydantic import BaseModel, Field

class PaymentMethod(str):
    CASH = "cash"
    UPI = "upi"
    BANK_TRANSFER = "bank_transfer"
    CHEQUE = "cheque"

class PaymentCreate(BaseModel):
    customer_id: str
    amount: float = Field(..., gt=0, json_schema_extra={"example": 3000.0})
    payment_method: str = Field("upi", json_schema_extra={"example": "upi"})
    payment_date: DateType = Field(default_factory=DateType.today)
    reference_number: Optional[str] = Field(None, json_schema_extra={"example": "UPI123456789"})
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    receipt_number: str
    customer_id: str
    customer_name: str
    amount: float
    payment_method: str
    payment_date: DateType
    reference_number: Optional[str]
    notes: Optional[str]
    created_at: datetime
