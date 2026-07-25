from typing import List, Optional, Dict, Any
from app.repositories.base import BaseRepository

class CustomerRepository(BaseRepository):
    def __init__(self):
        super().__init__("customers")

    def get_active_customers(self) -> List[Dict[str, Any]]:
        all_customers = self.list_all()
        return [
            c for c in all_customers 
            if not c.get("is_deleted", False) and c.get("status", "active") in ["active", "paused"]
        ]

    def search_customers(self, query: str) -> List[Dict[str, Any]]:
        all_customers = self.list_all()
        active_custs = [c for c in all_customers if not c.get("is_deleted", False)]
        if not query:
            return active_custs
        q = query.lower()
        return [
            c for c in active_custs 
            if q in str(c.get("name", "")).lower() or q in str(c.get("phone", "")).lower() or q in str(c.get("address", "")).lower()
        ]
