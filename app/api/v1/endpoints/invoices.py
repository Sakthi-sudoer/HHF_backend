from fastapi import APIRouter, Path, status
from app.models.response import ApiResponse
from app.models.invoice import InvoiceResponse
from app.services.invoice_engine import InvoiceEngine

router = APIRouter(prefix="/invoices", tags=["Invoice Engine"])
engine = InvoiceEngine()

@router.post("/generate/{subscription_id}", response_model=ApiResponse[InvoiceResponse], status_code=status.HTTP_201_CREATED, summary="Generate initial invoice")
def generate_invoice(subscription_id: str = Path(..., description="Subscription ID")):
    """
    Generates an itemized invoice for a subscription based on selected meals, days, rates, and delivery charges.
    """
    result = engine.generate_initial_invoice(subscription_id)
    return ApiResponse.ok(data=result, message="Invoice generated successfully")

@router.post("/recalculate/{subscription_id}", response_model=ApiResponse[InvoiceResponse], summary="Recalculate invoice after meal cancellations")
def recalculate_cancellation_invoice(subscription_id: str = Path(..., description="Subscription ID")):
    """
    Recalculates invoice after meal cancellations or early termination.
    Computes consumed meals, unused credits, delivery adjustments, refund due, or pending amount.
    """
    result = engine.calculate_cancellation_adjustment(subscription_id)
    return ApiResponse.ok(data=result, message="Invoice recalculated with cancellation adjustments")
