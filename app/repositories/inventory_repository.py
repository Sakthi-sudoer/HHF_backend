from typing import List, Optional, Dict, Any
from app.repositories.base import BaseRepository

class InventoryRepository(BaseRepository):
    def __init__(self):
        super().__init__("inventory")

    def get_low_stock_items(self) -> List[Dict[str, Any]]:
        all_items = self.list_all()
        return [
            item for item in all_items 
            if not item.get("is_deleted") and item.get("current_quantity", 0) <= item.get("min_threshold", 0)
        ]
