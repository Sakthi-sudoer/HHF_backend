from typing import List, Optional, Dict, Any
from app.repositories.base import BaseRepository

class CustomerRepository(BaseRepository):
    def __init__(self):
        super().__init__("customers")

    def get_active_customers(self) -> List[Dict[str, Any]]:
        return self.list_all(filters=[("status", "==", "active"), ("is_deleted", "==", False)])

    def search_customers(self, query: str) -> List[Dict[str, Any]]:
        all_customers = self.list_all(filters=[("is_deleted", "==", False)])
        if not query:
            return all_customers
        q = query.lower()
        return [
            c for c in all_customers 
            if q in c.get("name", "").lower() or q in c.get("phone", "").lower() or q in c.get("address", "").lower()
        ]
