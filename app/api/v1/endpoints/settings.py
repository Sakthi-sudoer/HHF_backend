from fastapi import APIRouter
from app.models.response import ApiResponse
from app.models.settings import GlobalSettings, GlobalSettingsUpdate
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["Global System Settings"])
service = SettingsService()

@router.get("", response_model=ApiResponse[GlobalSettings], summary="Get global settings")
def get_global_settings():
    """
    Fetches global business defaults:
    - Default meal rates (Breakfast, Lunch, Dinner)
    - Three meal lunch discount rate
    - Sunday holiday toggle
    - Default monthly subscription days (26 days)
    - Default daily delivery charge
    """
    result = service.get_settings()
    return ApiResponse.ok(data=result, message="Global settings retrieved")

@router.put("", response_model=ApiResponse[GlobalSettings], summary="Update global settings")
def update_global_settings(payload: GlobalSettingsUpdate):
    """
    Updates global pricing, delivery, and holiday rules.
    """
    result = service.update_settings(payload)
    return ApiResponse.ok(data=result, message="Global settings updated successfully")
