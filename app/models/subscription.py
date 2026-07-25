from enum import Enum
from typing import Optional
from datetime import date as DateType, datetime
from pydantic import BaseModel, Field

class SubscriptionType(str, Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    TRIAL = "trial"
    CUSTOM = "custom"

class FoodPreference(str, Enum):
    VEG = "veg"
    NON_VEG = "non_veg"

class MealSelection(BaseModel):
    breakfast: bool = Field(True, description="Enable breakfast delivery")
    lunch: bool = Field(True, description="Enable lunch delivery")
    dinner: bool = Field(True, description="Enable dinner delivery")

class FoodPreferenceSelection(BaseModel):
    breakfast: FoodPreference = Field(FoodPreference.VEG)
    lunch: FoodPreference = Field(FoodPreference.NON_VEG)
    dinner: FoodPreference = Field(FoodPreference.VEG)

class SubscriptionRates(BaseModel):
    breakfast_price: Optional[float] = Field(None, description="Override global breakfast price")
    lunch_price: Optional[float] = Field(None, description="Override global lunch price")
    dinner_price: Optional[float] = Field(None, description="Override global dinner price")
    delivery_charge: Optional[float] = Field(None, description="Override global delivery charge per day")

class SubscriptionCreate(BaseModel):
    customer_id: str
    subscription_type: SubscriptionType
    start_date: DateType
    end_date: Optional[DateType] = None  # Auto-calculated if monthly/weekly
    meals: MealSelection
    preferences: FoodPreferenceSelection
    rates: Optional[SubscriptionRates] = None
    custom_days: Optional[int] = Field(None, description="Number of days if type is CUSTOM")

class SubscriptionResponse(BaseModel):
    id: str
    customer_id: str
    subscription_type: SubscriptionType
    start_date: DateType
    end_date: DateType
    original_end_date: DateType
    meals: MealSelection
    preferences: FoodPreferenceSelection
    rates: SubscriptionRates
    status: str = "active"
    
    # Expiry Reminders & Renewals
    days_remaining: Optional[int] = None
    expiry_reminder_status: Optional[str] = "none" # "7_days", "3_days", "1_day", "expired", "none"
    renewed_from_subscription_id: Optional[str] = None
    invoice_number: Optional[str] = None

    # Extension tracking
    pending_breakfast_extensions: int = 0
    pending_lunch_extensions: int = 0
    pending_dinner_extensions: int = 0
    total_extended_days: int = 0
    
    created_at: datetime
    updated_at: datetime
