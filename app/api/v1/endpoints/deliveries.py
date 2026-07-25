from datetime import date
from typing import List
from fastapi import APIRouter, Query, Path, Body, status
from app.models.response import ApiResponse
from app.models.delivery import DeliveryDailyRecord, DeliveryMealCancelRequest, DeliveryUpdateResponse
from app.services.delivery_engine import DeliveryEngine

router = APIRouter(prefix="/deliveries", tags=["Daily Delivery Sheet Engine"])
engine = DeliveryEngine()

@router.get("/sheet", response_model=ApiResponse[List[DeliveryDailyRecord]], summary="Get daily delivery sheet")
def get_daily_sheet(target_date: date = Query(default_factory=date.today, description="Target delivery date (YYYY-MM-DD)")):
    """
    Fetches or auto-generates the daily delivery sheet for all active customer subscriptions.
    Automatically applies meal rules and Sunday holiday skips.
    """
    result = engine.get_daily_sheet(target_date)
    return ApiResponse.ok(data=result, message=f"Daily delivery sheet for {target_date} retrieved")

@router.post("/cancel-meal", response_model=ApiResponse[DeliveryUpdateResponse], summary="Cancel meal & trigger subscription extension")
def cancel_meal(
    target_date: date = Query(..., description="Delivery date"),
    customer_id: str = Query(..., description="Customer ID"),
    payload: DeliveryMealCancelRequest = Body(...)
):
    """
    Cancels a specific meal (Breakfast, Lunch, Dinner).
    Triggers automatic or manual subscription extension (+1 meal working day skipping Sundays).
    Returns rich metadata for frontend independence.
    """
    result = engine.cancel_meal_and_extend(target_date, customer_id, payload)
    return ApiResponse.ok(data=result, message=f"{payload.meal_type.capitalize()} cancelled and subscription extended")
