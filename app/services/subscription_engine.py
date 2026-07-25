import uuid
from datetime import date, timedelta, datetime, timezone
from typing import Optional, Dict, Any, List
from app.models.subscription import (
    SubscriptionCreate, SubscriptionResponse, SubscriptionType,
    MealSelection, FoodPreferenceSelection, SubscriptionRates
)
from app.repositories.subscription_repository import SubscriptionRepository
from app.repositories.customer_repository import CustomerRepository
from app.services.settings_service import SettingsService
from app.core.exceptions import EntityNotFoundException, BusinessRuleViolationException
from app.core.logging import logger

class SubscriptionEngine:
    def __init__(self):
        self.sub_repo = SubscriptionRepository()
        self.cust_repo = CustomerRepository()
        self.settings_service = SettingsService()

    @staticmethod
    def is_sunday(d: date) -> bool:
        return d.weekday() == 6

    def add_working_days(self, start_d: date, num_days: int, skip_sundays: bool = True) -> date:
        curr = start_d
        added = 0
        while added < num_days:
            if not (skip_sundays and self.is_sunday(curr)):
                added += 1
                if added == num_days:
                    break
            curr += timedelta(days=1)
        return curr

    def resolve_rates(self, meals: MealSelection, custom_rates: Optional[SubscriptionRates]) -> SubscriptionRates:
        global_s = self.settings_service.get_settings()
        all_three = meals.breakfast and meals.lunch and meals.dinner
        
        b_price = global_s.breakfast_price
        l_price = global_s.three_meal_lunch_discount_rate if all_three else global_s.lunch_price
        d_price = global_s.dinner_price
        del_charge = global_s.delivery_charge_per_day

        if custom_rates:
            if custom_rates.breakfast_price is not None:
                b_price = custom_rates.breakfast_price
            if custom_rates.lunch_price is not None:
                l_price = custom_rates.lunch_price
            if custom_rates.dinner_price is not None:
                d_price = custom_rates.dinner_price
            if custom_rates.delivery_charge is not None:
                del_charge = custom_rates.delivery_charge

        return SubscriptionRates(
            breakfast_price=b_price,
            lunch_price=l_price,
            dinner_price=d_price,
            delivery_charge=del_charge
        )

    def create_subscription(self, payload: SubscriptionCreate) -> SubscriptionResponse:
        cust = self.cust_repo.get_by_id(payload.customer_id)
        if not cust or cust.get("is_deleted"):
            raise EntityNotFoundException("Customer", payload.customer_id)

        existing_sub = self.sub_repo.get_active_by_customer(payload.customer_id)
        if existing_sub:
            self.sub_repo.update(existing_sub["id"], {"status": "replaced", "updated_at": datetime.now(timezone.utc).isoformat()})

        global_s = self.settings_service.get_settings()
        skip_sundays = global_s.sunday_holiday_enabled

        start_d = payload.start_date
        if payload.subscription_type == SubscriptionType.MONTHLY:
            num_days = global_s.default_monthly_days
            end_d = self.add_working_days(start_d, num_days, skip_sundays)
        elif payload.subscription_type == SubscriptionType.WEEKLY:
            num_days = 6
            end_d = self.add_working_days(start_d, num_days, skip_sundays)
        elif payload.subscription_type == SubscriptionType.TRIAL:
            if not payload.end_date:
                raise BusinessRuleViolationException("Trial subscription requires explicit end_date")
            end_d = payload.end_date
        elif payload.subscription_type == SubscriptionType.CUSTOM:
            if payload.custom_days:
                end_d = self.add_working_days(start_d, payload.custom_days, skip_sundays)
            elif payload.end_date:
                end_d = payload.end_date
            else:
                raise BusinessRuleViolationException("Custom subscription requires end_date or custom_days")
        else:
            raise BusinessRuleViolationException(f"Unsupported subscription type: {payload.subscription_type}")

        resolved_rates = self.resolve_rates(payload.meals, payload.rates)
        sub_id = f"sub_{uuid.uuid4().hex[:10]}"
        now_str = datetime.now(timezone.utc).isoformat()

        sub_dict = {
            "id": sub_id,
            "customer_id": payload.customer_id,
            "subscription_type": payload.subscription_type.value,
            "start_date": start_d.isoformat(),
            "end_date": end_d.isoformat(),
            "original_end_date": end_d.isoformat(),
            "meals": payload.meals.model_dump(),
            "preferences": payload.preferences.model_dump(),
            "rates": resolved_rates.model_dump(),
            "status": "active",
            "pending_breakfast_extensions": 0,
            "pending_lunch_extensions": 0,
            "pending_dinner_extensions": 0,
            "total_extended_days": 0,
            "created_at": now_str,
            "updated_at": now_str
        }

        self.sub_repo.create(sub_id, sub_dict)
        logger.info(f"Created subscription {sub_id} for customer {payload.customer_id}")
        return self._to_response(sub_dict)

    def extend_subscription(
        self, 
        subscription_id: str, 
        meal_type: str, 
        mode: str = "automatic", 
        manual_date: Optional[date] = None
    ) -> SubscriptionResponse:
        sub = self.sub_repo.get_by_id(subscription_id)
        if not sub:
            raise EntityNotFoundException("Subscription", subscription_id)

        global_s = self.settings_service.get_settings()
        skip_sundays = global_s.sunday_holiday_enabled

        curr_end_d = date.fromisoformat(sub["end_date"])
        
        if mode == "automatic":
            new_end_d = self.add_working_days(curr_end_d + timedelta(days=1), 1, skip_sundays)
        else:
            if not manual_date:
                raise BusinessRuleViolationException("Manual extension requires manual_date")
            new_end_d = max(curr_end_d, manual_date)

        pending_key = f"pending_{meal_type.lower()}_extensions"
        sub[pending_key] = sub.get(pending_key, 0) + 1
        sub["total_extended_days"] = sub.get("total_extended_days", 0) + 1
        sub["end_date"] = new_end_d.isoformat()
        sub["updated_at"] = datetime.now(timezone.utc).isoformat()

        self.sub_repo.update(subscription_id, sub)
        logger.info(f"Extended subscription {subscription_id} for {meal_type} to {new_end_d}")
        return self._to_response(sub)

    def get_subscription(self, subscription_id: str) -> SubscriptionResponse:
        sub = self.sub_repo.get_by_id(subscription_id)
        if not sub:
            raise EntityNotFoundException("Subscription", subscription_id)
        return self._to_response(sub)

    def _to_response(self, data: Dict[str, Any]) -> SubscriptionResponse:
        return SubscriptionResponse(
            id=data["id"],
            customer_id=data["customer_id"],
            subscription_type=SubscriptionType(data["subscription_type"]),
            start_date=date.fromisoformat(data["start_date"]),
            end_date=date.fromisoformat(data["end_date"]),
            original_end_date=date.fromisoformat(data["original_end_date"]),
            meals=MealSelection(**data["meals"]),
            preferences=FoodPreferenceSelection(**data["preferences"]),
            rates=SubscriptionRates(**data["rates"]),
            status=data["status"],
            pending_breakfast_extensions=data.get("pending_breakfast_extensions", 0),
            pending_lunch_extensions=data.get("pending_lunch_extensions", 0),
            pending_dinner_extensions=data.get("pending_dinner_extensions", 0),
            total_extended_days=data.get("total_extended_days", 0),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00"))
        )
