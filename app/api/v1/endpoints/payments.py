from fastapi import APIRouter, status
from app.models.response import ApiResponse
from app.models.payment import PaymentCreate, PaymentResponse
from app.services.ledger_engine import LedgerEngine

router = APIRouter(prefix="/payments", tags=["Payment Engine"])
engine = LedgerEngine()

@router.post("", response_model=ApiResponse[PaymentResponse], status_code=status.HTTP_201_CREATED, summary="Record customer payment")
def record_payment(payload: PaymentCreate):
    """
    Records a payment against a customer's account (Cash, UPI, Bank Transfer, Cheque).
    Generates a payment receipt number and updates the customer running balance.
    """
    result = engine.record_payment(payload)
    return ApiResponse.ok(data=result, message="Payment recorded successfully")
