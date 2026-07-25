from typing import List, Optional, Dict, Any
from datetime import date
from app.repositories.base import BaseRepository

class DeliveryRepository(BaseRepository):
    def __init__(self):
        super().__init__("dailyDeliveries")

    def get_by_date(self, target_date: str) -> List[Dict[str, Any]]:
        return self.list_all(filters=[("date", "==", target_date)])

    def get_customer_delivery(self, target_date: str, customer_id: str) -> Optional[Dict[str, Any]]:
        records = self.list_all(filters=[("date", "==", target_date), ("customer_id", "==", customer_id)])
        return records[0] if records else None

    def get_customer_deliveries_range(self, customer_id: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        all_records = self.list_all(filters=[("customer_id", "==", customer_id)])
        return [r for r in all_records if start_date <= r.get("date", "") <= end_date]
