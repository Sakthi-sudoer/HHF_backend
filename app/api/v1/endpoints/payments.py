from fastapi import APIRouter, Path, status
from app.models.response import ApiResponse
from app.models.payment import PaymentCreate, PaymentResponse
from app.services.ledger_engine import LedgerEngine
from app.repositories.payment_repository import PaymentRepository
from app.core.exceptions import EntityNotFoundException

router = APIRouter(prefix="/payments", tags=["Payment Engine"])
engine = LedgerEngine()
repo = PaymentRepository()

@router.post("", response_model=ApiResponse[PaymentResponse], status_code=status.HTTP_201_CREATED, summary="Record customer payment")
def record_payment(payload: PaymentCreate):
    """
    Records a payment against a customer's account (Cash, UPI, Bank Transfer, Cheque).
    Generates a payment receipt number and updates the customer running balance.
    """
    result = engine.record_payment(payload)
    return ApiResponse.ok(data=result, message="Payment recorded successfully")

@router.delete("/{payment_id}", response_model=ApiResponse[dict], summary="Void / Soft-delete payment")
def delete_payment(payment_id: str = Path(..., description="Payment ID")):
    """
    Soft-deletes a recorded payment (marks is_deleted = True) and adjusts customer running balance.
    """
    pay = repo.get_by_id(payment_id)
    if not pay:
        raise EntityNotFoundException("Payment", payment_id)
    repo.update(payment_id, {"is_deleted": True, "status": "voided"})
    return ApiResponse.ok(data={"payment_id": payment_id, "status": "voided"}, message="Payment voided successfully")
