from typing import List, Optional
from fastapi import APIRouter, Query, Path, status
from app.models.response import ApiResponse
from app.models.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["Customer Management"])
service = CustomerService()

@router.post("", response_model=ApiResponse[CustomerResponse], status_code=status.HTTP_201_CREATED, summary="Create a new customer")
def create_customer(payload: CustomerCreate):
    """
    Creates a new customer profile.
    Automatically initializes customer with active status.
    """
    result = service.create_customer(payload)
    return ApiResponse.ok(data=result, message="Customer created successfully")

@router.get("", response_model=ApiResponse[List[CustomerResponse]], summary="Search & list customers")
def list_customers(query: Optional[str] = Query(None, description="Search term for name, phone, or address")):
    """
    Retrieves all active customers, with optional instant filtering by query string.
    """
    result = service.search_customers(query=query or "")
    return ApiResponse.ok(data=result, message="Customers retrieved successfully")

@router.get("/{customer_id}", response_model=ApiResponse[CustomerResponse], summary="Get customer details")
def get_customer(customer_id: str = Path(..., description="Customer ID")):
    """
    Fetches detailed profile information for a single customer.
    """
    result = service.get_customer(customer_id)
    return ApiResponse.ok(data=result, message="Customer details retrieved")

@router.put("/{customer_id}", response_model=ApiResponse[CustomerResponse], summary="Update customer details")
def update_customer(payload: CustomerUpdate, customer_id: str = Path(..., description="Customer ID")):
    """
    Updates editable fields of an existing customer profile.
    """
    result = service.update_customer(customer_id, payload)
    return ApiResponse.ok(data=result, message="Customer updated successfully")

@router.delete("/{customer_id}", response_model=ApiResponse[CustomerResponse], summary="Archive customer (Soft Delete)")
def archive_customer(customer_id: str = Path(..., description="Customer ID")):
    """
    Soft-deletes / archives a customer profile without losing financial or delivery history.
    """
    result = service.archive_customer(customer_id)
    return ApiResponse.ok(data=result, message="Customer archived successfully")
