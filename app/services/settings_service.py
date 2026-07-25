from typing import Dict, Any
from app.repositories.settings_repository import SettingsRepository
from app.models.settings import GlobalSettings, GlobalSettingsUpdate
from app.core.config import settings as app_settings

class SettingsService:
    def __init__(self):
        self.repo = SettingsRepository()

    def get_settings(self) -> GlobalSettings:
        data = self.repo.get_global_settings()
        if not data:
            # Fallback to config default
            default_obj = GlobalSettings(
                breakfast_price=app_settings.DEFAULT_BREAKFAST_PRICE,
                lunch_price=app_settings.DEFAULT_LUNCH_PRICE,
                dinner_price=app_settings.DEFAULT_DINNER_PRICE,
                three_meal_lunch_discount_rate=80.0,
                delivery_charge_per_day=app_settings.DEFAULT_DELIVERY_CHARGE,
                default_monthly_days=app_settings.DEFAULT_MONTHLY_DAYS,
                sunday_holiday_enabled=app_settings.SUNDAY_HOLIDAY_ENABLED
            )
            self.repo.save_global_settings(default_obj.model_dump())
            return default_obj
        return GlobalSettings(**data)

    def update_settings(self, update_data: GlobalSettingsUpdate) -> GlobalSettings:
        current = self.get_settings().model_dump()
        for k, v in update_data.model_dump(exclude_unset=True).items():
            if v is not None:
                current[k] = v
        self.repo.save_global_settings(current)
        return GlobalSettings(**current)
