from typing import List, Dict, Any
from app.repositories.base import BaseRepository

class PaymentRepository(BaseRepository):
    def __init__(self):
        super().__init__("payments")

    def get_by_customer(self, customer_id: str) -> List[Dict[str, Any]]:
        return self.list_all(filters=[("customer_id", "==", customer_id)])
