from typing import Optional, List
from datetime import date as DateType, datetime
from pydantic import BaseModel, Field
from app.models.subscription import FoodPreference

class DeliveryMealState(BaseModel):
    delivered: bool
    cancelled: bool = False
    preference: FoodPreference

class DeliveryDailyRecord(BaseModel):
    id: str
    date: DateType
    customer_id: str
    subscription_id: str
    customer_name: str
    breakfast: DeliveryMealState
    lunch: DeliveryMealState
    dinner: DeliveryMealState
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class DeliveryMealCancelRequest(BaseModel):
    meal_type: str = Field(..., description="'breakfast', 'lunch', or 'dinner'")
    extension_mode: str = Field("automatic", description="'automatic' or 'manual'")
    manual_extension_date: Optional[DateType] = Field(None, description="Required if extension_mode is 'manual'")

class DeliveryUpdateResponse(BaseModel):
    delivery: DeliveryDailyRecord
    meal_cancelled: bool
    cancelled_meal_type: str
    extension_created: bool
    extension_mode: str
    extension_date: Optional[DateType] = None
    pending_extensions_count: int
    new_subscription_end_date: DateType
    balance_updated: bool
    invoice_requires_regeneration: bool = True
