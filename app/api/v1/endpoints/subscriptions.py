from datetime import datetime, timezone
from fastapi import APIRouter, Path, status
from app.models.response import ApiResponse
from app.models.subscription import SubscriptionCreate, SubscriptionResponse
from app.services.subscription_engine import SubscriptionEngine
from app.services.invoice_engine import InvoiceEngine
from app.repositories.subscription_repository import SubscriptionRepository
from app.core.exceptions import EntityNotFoundException

router = APIRouter(prefix="/subscriptions", tags=["Subscription Engine"])
engine = SubscriptionEngine()
inv_engine = InvoiceEngine()
sub_repo = SubscriptionRepository()

@router.post("", response_model=ApiResponse[SubscriptionResponse], status_code=status.HTTP_201_CREATED, summary="Create customer subscription")
def create_subscription(payload: SubscriptionCreate):
    """
    Creates a new subscription (Monthly, Weekly, Trial, Custom).
    Automatically calculates start/end dates, Sunday holiday skips, custom rate overrides, and initial invoice.
    """
    result = engine.create_subscription(payload)
    # Auto-generate initial invoice
    inv_engine.generate_initial_invoice(result.id)
    return ApiResponse.ok(data=result, message="Subscription created and invoice generated")

@router.get("/{subscription_id}", response_model=ApiResponse[SubscriptionResponse], summary="Get subscription details")
def get_subscription(subscription_id: str = Path(..., description="Subscription ID")):
    """
    Retrieves full details of a subscription including pending extension counters and calculated end date.
    """
    result = engine.get_subscription(subscription_id)
    return ApiResponse.ok(data=result, message="Subscription details retrieved")

@router.delete("/{subscription_id}", response_model=ApiResponse[dict], summary="Cancel / Soft-delete subscription")
def cancel_subscription(subscription_id: str = Path(..., description="Subscription ID")):
    """
    Cancels / soft-deletes a subscription (sets status = 'cancelled', is_deleted = True)
    and calculates remaining credit adjustment for the customer.
    """
    sub = sub_repo.get_by_id(subscription_id)
    if not sub:
        raise EntityNotFoundException("Subscription", subscription_id)
    
    sub_repo.update(subscription_id, {
        "status": "cancelled", 
        "is_deleted": True, 
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    inv_res = inv_engine.calculate_cancellation_adjustment(subscription_id)
    return ApiResponse.ok(
        data={"subscription_id": subscription_id, "status": "cancelled", "invoice_adjustment": inv_res.model_dump()}, 
        message="Subscription cancelled and invoice credit calculated"
    )
