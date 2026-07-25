import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Path, Query, status
from app.models.response import ApiResponse
from app.models.inventory import InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse
from app.repositories.inventory_repository import InventoryRepository
from app.core.exceptions import EntityNotFoundException

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])
repo = InventoryRepository()

@router.post("", response_model=ApiResponse[InventoryItemResponse], status_code=status.HTTP_201_CREATED, summary="Add inventory item")
def create_inventory_item(payload: InventoryItemCreate):
    item_id = f"inv_item_{uuid.uuid4().hex[:10]}"
    now_str = datetime.now(timezone.utc).isoformat()
    is_low = payload.current_quantity <= payload.min_threshold

    item_dict = {
        "id": item_id,
        "name": payload.name,
        "category": payload.category,
        "current_quantity": payload.current_quantity,
        "unit": payload.unit,
        "min_threshold": payload.min_threshold,
        "unit_cost": payload.unit_cost,
        "is_low_stock": is_low,
        "is_deleted": False,
        "created_at": now_str,
        "updated_at": now_str
    }
    repo.create(item_id, item_dict)

    res = InventoryItemResponse(
        id=item_id,
        name=payload.name,
        category=payload.category,
        current_quantity=payload.current_quantity,
        unit=payload.unit,
        min_threshold=payload.min_threshold,
        unit_cost=payload.unit_cost,
        is_low_stock=is_low,
        is_deleted=False,
        created_at=datetime.fromisoformat(now_str.replace("Z", "+00:00")),
        updated_at=datetime.fromisoformat(now_str.replace("Z", "+00:00"))
    )
    return ApiResponse.ok(data=res, message="Inventory item added successfully")

@router.get("", response_model=ApiResponse[List[InventoryItemResponse]], summary="List all inventory items")
def list_inventory():
    items = repo.list_all()
    res = [
        InventoryItemResponse(
            id=item["id"],
            name=item["name"],
            category=item["category"],
            current_quantity=item["current_quantity"],
            unit=item["unit"],
            min_threshold=item["min_threshold"],
            unit_cost=item.get("unit_cost", 0.0),
            is_low_stock=item.get("current_quantity", 0) <= item.get("min_threshold", 0),
            is_deleted=item.get("is_deleted", False),
            created_at=datetime.fromisoformat(item["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(item["updated_at"].replace("Z", "+00:00"))
        ) for item in items if not item.get("is_deleted")
    ]
    return ApiResponse.ok(data=res, message="Inventory items retrieved")

@router.put("/{item_id}", response_model=ApiResponse[InventoryItemResponse], summary="Update inventory item stock")
def update_inventory_item(payload: InventoryItemUpdate, item_id: str = Path(..., description="Inventory Item ID")):
    item = repo.get_by_id(item_id)
    if not item or item.get("is_deleted"):
        raise EntityNotFoundException("Inventory Item", item_id)

    update_dict = payload.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    new_qty = update_dict.get("current_quantity", item["current_quantity"])
    new_thresh = update_dict.get("min_threshold", item["min_threshold"])
    update_dict["is_low_stock"] = new_qty <= new_thresh

    updated = repo.update(item_id, update_dict)
    res = InventoryItemResponse(
        id=item_id,
        name=updated["name"],
        category=updated["category"],
        current_quantity=updated["current_quantity"],
        unit=updated["unit"],
        min_threshold=updated["min_threshold"],
        unit_cost=updated.get("unit_cost", 0.0),
        is_low_stock=updated.get("is_low_stock", False),
        is_deleted=updated.get("is_deleted", False),
        created_at=datetime.fromisoformat(updated["created_at"].replace("Z", "+00:00")),
        updated_at=datetime.fromisoformat(updated["updated_at"].replace("Z", "+00:00"))
    )
    return ApiResponse.ok(data=res, message="Inventory item updated successfully")

@router.delete("/{item_id}", response_model=ApiResponse[dict], summary="Soft delete inventory item")
def delete_inventory_item(item_id: str = Path(..., description="Inventory Item ID")):
    item = repo.get_by_id(item_id)
    if not item or item.get("is_deleted"):
        raise EntityNotFoundException("Inventory Item", item_id)
    repo.update(item_id, {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()})
    return ApiResponse.ok(data={"id": item_id, "is_deleted": True}, message="Inventory item deleted")
