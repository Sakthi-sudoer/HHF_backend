from typing import List, Optional, Dict, Any
from app.repositories.base import BaseRepository

class SubscriptionRepository(BaseRepository):
    def __init__(self):
        super().__init__("subscriptions")

    def get_active_by_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        subs = self.list_all(filters=[("customer_id", "==", customer_id), ("status", "==", "active")])
        return subs[0] if subs else None

    def get_all_active_subscriptions(self) -> List[Dict[str, Any]]:
        return self.list_all(filters=[("status", "==", "active")])
