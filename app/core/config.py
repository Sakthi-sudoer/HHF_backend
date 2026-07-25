from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Food Subscription & Ledger Management System API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = "*"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> Union[str, List[str]]:
        if isinstance(v, str) and not v.startswith("["):
            if v.strip() == "*":
                return ["*"]
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Firebase / Firestore
    FIREBASE_CREDENTIALS_PATH: str = "credentials/firebase_service_account.json"
    FIREBASE_CREDENTIALS_JSON: Union[str, None] = None
    FIREBASE_PROJECT_ID: str = ""

    # Business Defaults
    DEFAULT_BREAKFAST_PRICE: float = 64.0
    DEFAULT_LUNCH_PRICE: float = 100.0
    DEFAULT_DINNER_PRICE: float = 64.0
    DEFAULT_DELIVERY_CHARGE: float = 0.0
    DEFAULT_MONTHLY_DAYS: int = 26
    SUNDAY_HOLIDAY_ENABLED: bool = True

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "JSON"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)

settings = Settings()
