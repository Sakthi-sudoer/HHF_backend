from pydantic import BaseModel, Field

class GlobalSettings(BaseModel):
    breakfast_price: float = Field(64.0, description="Default price per breakfast meal")
    lunch_price: float = Field(100.0, description="Default price per lunch meal")
    dinner_price: float = Field(64.0, description="Default price per dinner meal")
    three_meal_lunch_discount_rate: float = Field(80.0, description="Discounted lunch rate if all 3 meals selected")
    delivery_charge_per_day: float = Field(0.0, description="Default daily delivery fee")
    default_monthly_days: int = Field(26, description="Default active delivery days in a monthly subscription")
    sunday_holiday_enabled: bool = Field(True, description="Automatically skip Sundays during delivery and extensions")

class GlobalSettingsUpdate(BaseModel):
    breakfast_price: float = None
    lunch_price: float = None
    dinner_price: float = None
    three_meal_lunch_discount_rate: float = None
    delivery_charge_per_day: float = None
    default_monthly_days: int = None
    sunday_holiday_enabled: bool = None
