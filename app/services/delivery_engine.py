import uuid
from datetime import date, datetime, timezone
from typing import List, Optional, Dict, Any
from app.models.delivery import DeliveryDailyRecord, DeliveryMealState, DeliveryUpdateResponse, DeliveryMealCancelRequest
from app.models.subscription import FoodPreference
from app.repositories.delivery_repository import DeliveryRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.subscription_repository import SubscriptionRepository
from app.services.subscription_engine import SubscriptionEngine
from app.services.settings_service import SettingsService
from app.core.exceptions import EntityNotFoundException, BusinessRuleViolationException
from app.core.logging import logger

class DeliveryEngine:
    def __init__(self):
        self.delivery_repo = DeliveryRepository()
        self.cust_repo = CustomerRepository()
        self.sub_repo = SubscriptionRepository()
        self.sub_engine = SubscriptionEngine()
        self.settings_service = SettingsService()

    def get_daily_sheet(self, target_date: date) -> List[DeliveryDailyRecord]:
        target_str = target_date.isoformat()
        records = self.delivery_repo.get_by_date(target_str)
        
        active_subs = self.sub_repo.get_all_active_subscriptions()
        existing_cust_ids = {r["customer_id"] for r in records}

        global_s = self.settings_service.get_settings()
        is_sunday = target_date.weekday() == 6

        for sub in active_subs:
            sub_start = date.fromisoformat(sub["start_date"])
            sub_end = date.fromisoformat(sub["end_date"])

            if sub_start <= target_date <= sub_end and sub["customer_id"] not in existing_cust_ids:
                cust = self.cust_repo.get_by_id(sub["customer_id"])
                if not cust or cust.get("is_deleted") or cust.get("status") != "active":
                    continue

                is_delivery_day = not (is_sunday and global_s.sunday_holiday_enabled)
                meals_cfg = sub["meals"]
                prefs_cfg = sub["preferences"]

                rec_id = f"del_{target_str}_{sub['customer_id']}"
                now_str = datetime.now(timezone.utc).isoformat()

                rec_dict = {
                    "id": rec_id,
                    "date": target_str,
                    "customer_id": sub["customer_id"],
                    "subscription_id": sub["id"],
                    "customer_name": cust["name"],
                    "breakfast": {
                        "delivered": meals_cfg["breakfast"] and is_delivery_day,
                        "cancelled": False,
                        "preference": prefs_cfg["breakfast"]
                    },
                    "lunch": {
                        "delivered": meals_cfg["lunch"] and is_delivery_day,
                        "cancelled": False,
                        "preference": prefs_cfg["lunch"]
                    },
                    "dinner": {
                        "delivered": meals_cfg["dinner"] and is_delivery_day,
                        "cancelled": False,
                        "preference": prefs_cfg["dinner"]
                    },
                    "notes": None,
                    "created_at": now_str,
                    "updated_at": now_str
                }

                self.delivery_repo.create(rec_id, rec_dict)
                records.append(rec_dict)

        result = []
        for r in records:
            result.append(self._to_record(r))
        return result

    def cancel_meal_and_extend(
        self, 
        target_date: date, 
        customer_id: str, 
        cancel_req: DeliveryMealCancelRequest
    ) -> DeliveryUpdateResponse:
        target_str = target_date.isoformat()
        rec = self.delivery_repo.get_customer_delivery(target_str, customer_id)
        if not rec:
            self.get_daily_sheet(target_date)
            rec = self.delivery_repo.get_customer_delivery(target_str, customer_id)
            if not rec:
                raise EntityNotFoundException("Delivery Record", f"{target_str}:{customer_id}")

        meal_key = cancel_req.meal_type.lower()
        if meal_key not in ["breakfast", "lunch", "dinner"]:
            raise BusinessRuleViolationException(f"Invalid meal type: {cancel_req.meal_type}")

        meal_state = rec[meal_key]
        if not meal_state.get("delivered") and meal_state.get("cancelled"):
            pass
        else:
            meal_state["delivered"] = False
            meal_state["cancelled"] = True
            rec["updated_at"] = datetime.now(timezone.utc).isoformat()
            self.delivery_repo.update(rec["id"], rec)

        sub_id = rec["subscription_id"]
        ext_res = self.sub_engine.extend_subscription(
            subscription_id=sub_id,
            meal_type=meal_key,
            mode=cancel_req.extension_mode,
            manual_date=cancel_req.manual_extension_date
        )

        return DeliveryUpdateResponse(
            delivery=self._to_record(rec),
            meal_cancelled=True,
            cancelled_meal_type=meal_key,
            extension_created=True,
            extension_mode=cancel_req.extension_mode,
            extension_date=ext_res.end_date,
            pending_extensions_count=getattr(ext_res, f"pending_{meal_key}_extensions"),
            new_subscription_end_date=ext_res.end_date,
            balance_updated=True,
            invoice_requires_regeneration=True
        )

    def _to_record(self, r: Dict[str, Any]) -> DeliveryDailyRecord:
        return DeliveryDailyRecord(
            id=r["id"],
            date=date.fromisoformat(r["date"]),
            customer_id=r["customer_id"],
            subscription_id=r["subscription_id"],
            customer_name=r["customer_name"],
            breakfast=DeliveryMealState(**r["breakfast"]),
            lunch=DeliveryMealState(**r["lunch"]),
            dinner=DeliveryMealState(**r["dinner"]),
            notes=r.get("notes"),
            created_at=datetime.fromisoformat(r["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(r["updated_at"].replace("Z", "+00:00"))
        )
