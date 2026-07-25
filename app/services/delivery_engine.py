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
        existing_cust_ids = {r["customer_id"] for r in records}

        global_s = self.settings_service.get_settings()
        is_sunday = target_date.weekday() == 6
        is_delivery_day = not (is_sunday and global_s.sunday_holiday_enabled)

        # 1. Process active subscription collection documents
        active_subs = self.sub_repo.get_all_active_subscriptions()
        active_custs = self.cust_repo.get_active_customers()
        cust_map = {c["id"]: c for c in active_custs}

        for sub in active_subs:
            try:
                sub_start = date.fromisoformat(str(sub["start_date"]))
                sub_end = date.fromisoformat(str(sub["end_date"]))
            except Exception:
                continue

            if sub_start <= target_date <= sub_end and sub["customer_id"] not in existing_cust_ids:
                cust = cust_map.get(sub["customer_id"])
                if not cust or cust.get("is_deleted") or str(cust.get("status", "active")).lower() not in ["active", "paused"]:
                    continue

                meals_cfg = sub.get("meals", {"breakfast": True, "lunch": True, "dinner": True})
                prefs_cfg = sub.get("preferences", {"breakfast": "veg", "lunch": "veg", "dinner": "veg"})

                rec_id = f"del_{target_str}_{sub['customer_id']}"
                now_str = datetime.now(timezone.utc).isoformat()

                rec_dict = {
                    "id": rec_id,
                    "date": target_str,
                    "customer_id": sub["customer_id"],
                    "subscription_id": sub["id"],
                    "customer_name": cust.get("name", "Customer"),
                    "breakfast": {
                        "delivered": bool(meals_cfg.get("breakfast", True)) and is_delivery_day,
                        "cancelled": False,
                        "preference": prefs_cfg.get("breakfast", "veg")
                    },
                    "lunch": {
                        "delivered": bool(meals_cfg.get("lunch", True)) and is_delivery_day,
                        "cancelled": False,
                        "preference": prefs_cfg.get("lunch", "veg")
                    },
                    "dinner": {
                        "delivered": bool(meals_cfg.get("dinner", True)) and is_delivery_day,
                        "cancelled": False,
                        "preference": prefs_cfg.get("dinner", "veg")
                    },
                    "notes": None,
                    "created_at": now_str,
                    "updated_at": now_str
                }

                self.delivery_repo.create(rec_id, rec_dict)
                records.append(rec_dict)
                existing_cust_ids.add(sub["customer_id"])

        # 2. Process legacy inline customer subscription documents (start, end, breakfast, lunch, dinner)
        for cust in active_custs:
            cust_id = cust["id"]
            if cust_id in existing_cust_ids:
                continue

            start_str = cust.get("start")
            end_str = cust.get("end")
            if not start_str or not end_str:
                continue

            try:
                c_start = date.fromisoformat(str(start_str))
                c_end = date.fromisoformat(str(end_str))
            except Exception:
                continue

            if c_start <= target_date <= c_end:
                rec_id = f"del_{target_str}_{cust_id}"
                now_str = datetime.now(timezone.utc).isoformat()

                b_active = bool(cust.get("breakfast", True))
                l_active = bool(cust.get("lunch", True))
                d_active = bool(cust.get("dinner", True))

                rec_dict = {
                    "id": rec_id,
                    "date": target_str,
                    "customer_id": cust_id,
                    "subscription_id": f"sub_legacy_{cust_id}",
                    "customer_name": cust.get("name", "Customer"),
                    "breakfast": {
                        "delivered": b_active and is_delivery_day,
                        "cancelled": False,
                        "preference": "veg"
                    },
                    "lunch": {
                        "delivered": l_active and is_delivery_day,
                        "cancelled": False,
                        "preference": "non_veg"
                    },
                    "dinner": {
                        "delivered": d_active and is_delivery_day,
                        "cancelled": False,
                        "preference": "veg"
                    },
                    "notes": cust.get("notes"),
                    "created_at": now_str,
                    "updated_at": now_str
                }

                self.delivery_repo.create(rec_id, rec_dict)
                records.append(rec_dict)
                existing_cust_ids.add(cust_id)

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

        sub_id = rec.get("subscription_id", f"sub_legacy_{customer_id}")
        try:
            ext_res = self.sub_engine.extend_subscription(
                subscription_id=sub_id,
                meal_type=meal_key,
                mode=cancel_req.extension_mode,
                manual_date=cancel_req.manual_extension_date
            )
            new_end = ext_res.end_date
            pending_cnt = getattr(ext_res, f"pending_{meal_key}_extensions", 1)
        except Exception:
            new_end = target_date
            pending_cnt = 1

        return DeliveryUpdateResponse(
            delivery=self._to_record(rec),
            meal_cancelled=True,
            cancelled_meal_type=meal_key,
            extension_created=True,
            extension_mode=cancel_req.extension_mode,
            extension_date=new_end,
            pending_extensions_count=pending_cnt,
            new_subscription_end_date=new_end,
            balance_updated=True,
            invoice_requires_regeneration=True
        )

    def _to_record(self, r: Dict[str, Any]) -> DeliveryDailyRecord:
        now_dt = datetime.now(timezone.utc)
        created_at = now_dt
        if r.get("created_at"):
            try:
                created_at = datetime.fromisoformat(str(r["created_at"]).replace("Z", "+00:00"))
            except Exception:
                pass

        updated_at = now_dt
        if r.get("updated_at"):
            try:
                updated_at = datetime.fromisoformat(str(r["updated_at"]).replace("Z", "+00:00"))
            except Exception:
                pass

        return DeliveryDailyRecord(
            id=r["id"],
            date=date.fromisoformat(str(r["date"])),
            customer_id=r["customer_id"],
            subscription_id=r.get("subscription_id", f"sub_{r['customer_id']}"),
            customer_name=r.get("customer_name", "Customer"),
            breakfast=DeliveryMealState(**r["breakfast"]),
            lunch=DeliveryMealState(**r["lunch"]),
            dinner=DeliveryMealState(**r["dinner"]),
            notes=r.get("notes"),
            created_at=created_at,
            updated_at=updated_at
        )
