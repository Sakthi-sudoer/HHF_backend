from typing import Optional
from datetime import date as DateType, datetime
from pydantic import BaseModel, Field

class ExpenseCategory(str):
    GROCERIES = "groceries"
    VEGETABLES = "vegetables"
    MILK_DAIRY = "milk_dairy"
    PACKAGING = "packaging"
    TRANSPORT = "transport"
    SALARY = "salary"
    UTILITIES = "utilities"
    MISC = "misc"

class ExpenseCreate(BaseModel):
    date: DateType = Field(default_factory=DateType.today)
    category: str = Field("groceries", example="groceries")
    amount: float = Field(..., gt=0, example=1200.0)
    description: str = Field(..., example="Rice & Vegetables purchase")
    paid_to: Optional[str] = Field(None, example="Local Vendor")

class ExpenseResponse(BaseModel):
    id: str
    date: DateType
    category: str
    amount: float
    description: str
    paid_to: Optional[str]
    created_at: datetime
