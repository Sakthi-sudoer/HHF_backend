from typing import List, Optional, Dict, Any
from app.repositories.base import BaseRepository

class InvoiceRepository(BaseRepository):
    def __init__(self):
        super().__init__("invoices")

    def get_by_customer(self, customer_id: str) -> List[Dict[str, Any]]:
        return self.list_all(filters=[("customer_id", "==", customer_id)])

    def get_latest_invoice_for_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        invs = self.list_all(filters=[("subscription_id", "==", subscription_id)])
        if not invs:
            return None
        invs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return invs[0]
