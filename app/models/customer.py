from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class CustomerStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"

class CustomerBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Ravi Kumar"})
    phone: str = Field(..., json_schema_extra={"example": "9876543210"})
    address: str = Field(..., json_schema_extra={"example": "123 Main Street, Sector 4"})
    landmark: Optional[str] = Field(None, json_schema_extra={"example": "Near City Park"})

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    landmark: Optional[str] = None
    status: Optional[CustomerStatus] = None

class CustomerResponse(CustomerBase):
    id: str = Field(..., alias="id")
    status: CustomerStatus = CustomerStatus.ACTIVE
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)
