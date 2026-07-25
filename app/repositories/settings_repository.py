from typing import Optional, Dict, Any
from app.repositories.base import BaseRepository

class SettingsRepository(BaseRepository):
    def __init__(self):
        super().__init__("settings")

    def get_global_settings(self) -> Optional[Dict[str, Any]]:
        return self.get_by_id("global")

    def save_global_settings(self, settings_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.create("global", settings_data)
