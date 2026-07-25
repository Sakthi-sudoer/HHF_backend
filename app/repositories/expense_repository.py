from typing import List, Dict, Any
from app.repositories.base import BaseRepository

class ExpenseRepository(BaseRepository):
    def __init__(self):
        super().__init__("expenses")

    def get_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        all_exp = self.list_all()
        return [e for e in all_exp if start_date <= e.get("date", "") <= end_date]
