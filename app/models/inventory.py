from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class InventoryItemBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Basmati Rice"})
    category: str = Field("Spices & Grains", json_schema_extra={"example": "Groceries"})
    current_quantity: float = Field(..., gt=0, json_schema_extra={"example": 50.0})
    unit: str = Field("kg", json_schema_extra={"example": "kg"})
    min_threshold: float = Field(10.0, json_schema_extra={"example": 10.0})
    unit_cost: float = Field(0.0, json_schema_extra={"example": 60.0})

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    current_quantity: Optional[float] = None
    unit: Optional[str] = None
    min_threshold: Optional[float] = None
    unit_cost: Optional[float] = None

class InventoryItemResponse(InventoryItemBase):
    id: str
    is_low_stock: bool = False
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)
