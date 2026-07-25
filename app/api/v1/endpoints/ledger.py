from fastapi import APIRouter, Path
from app.models.response import ApiResponse
from app.models.ledger import CustomerLedgerSummary
from app.services.ledger_engine import LedgerEngine

router = APIRouter(prefix="/ledger", tags=["Ledger Engine"])
engine = LedgerEngine()

@router.get("/customer/{customer_id}", response_model=ApiResponse[CustomerLedgerSummary], summary="Get customer ledger statement")
def get_customer_ledger(customer_id: str = Path(..., description="Customer ID")):
    """
    Retrieves GPay-style double-entry ledger timeline, active invoice breakdown, payment history, total invoiced, total paid, and current pending balance.
    """
    result = engine.get_customer_ledger(customer_id)
    return ApiResponse.ok(data=result, message="Customer ledger retrieved successfully")
