from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel, Field

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = Field(True, description="Indicates whether the request was processed successfully")
    data: Optional[T] = Field(None, description="Response payload data")
    message: str = Field("", description="Human-readable response message")
    errors: List[str] = Field(default_factory=list, description="List of error messages or validation failures")

    @classmethod
    def ok(cls, data: T = None, message: str = "Operation completed successfully") -> "ApiResponse[T]":
        return cls(success=True, data=data, message=message, errors=[])

    @classmethod
    def fail(cls, message: str, errors: Optional[List[str]] = None, data: Any = None) -> "ApiResponse[T]":
        return cls(success=False, data=data, message=message, errors=errors or [message])
