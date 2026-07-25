from fastapi import APIRouter
from app.models.response import ApiResponse
from app.models.settings import GlobalSettings, GlobalSettingsUpdate
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["Global System Settings"])
service = SettingsService()

@router.get("", response_model=ApiResponse[GlobalSettings], summary="Get enterprise system settings")
def get_global_settings():
    """
    Fetches comprehensive enterprise business settings:
    - Business Profile & Branding (Name, Tagline, Contact, Address, GSTIN)
    - Meal Pricing & Discount Engine (Breakfast, Lunch, Dinner, 3-Meal Combo Rate)
    - Delivery & Logistics (Daily Fee, Free Distance Radius, Extra KM Rate, Timings)
    - Calendar & Working Days (Monthly/Weekly Working Days, Sunday Auto-Skip)
    - Financial & Invoicing Controls (Prefix, Container Deposit, UPI ID, WhatsApp Alerts)
    """
    result = service.get_settings()
    return ApiResponse.ok(data=result, message="Global settings retrieved")

@router.put("", response_model=ApiResponse[GlobalSettings], summary="Update enterprise system settings")
def update_global_settings(payload: GlobalSettingsUpdate):
    """
    Updates enterprise pricing, branding, delivery logistics, and invoicing rules.
    """
    result = service.update_settings(payload)
    return ApiResponse.ok(data=result, message="Global settings updated successfully")
