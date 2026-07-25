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
    now_dt = datetime.now(timezone.utc)
    res = []
    for item in items:
        if item.get("is_deleted", False):
            continue
        
        qty = float(item.get("current_quantity") if item.get("current_quantity") is not None else item.get("stockQty", 0.0))
        thresh = float(item.get("min_threshold") if item.get("min_threshold") is not None else item.get("minThreshold", 10.0))
        
        created_at = now_dt
        if item.get("created_at"):
            try:
                created_at = datetime.fromisoformat(str(item["created_at"]).replace("Z", "+00:00"))
            except Exception:
                pass

        updated_at = now_dt
        if item.get("updated_at"):
            try:
                updated_at = datetime.fromisoformat(str(item["updated_at"]).replace("Z", "+00:00"))
            except Exception:
                pass

        res.append(InventoryItemResponse(
            id=str(item.get("id", "inv_unk")),
            name=str(item.get("name", "Item")),
            category=str(item.get("category", "General")),
            current_quantity=qty,
            unit=str(item.get("unit", "pcs")),
            min_threshold=thresh,
            unit_cost=float(item.get("unit_cost", 0.0)),
            is_low_stock=qty <= thresh,
            is_deleted=False,
            created_at=created_at,
            updated_at=updated_at
        ))
    return ApiResponse.ok(data=res, message="Inventory items retrieved")

@router.put("/{item_id}", response_model=ApiResponse[InventoryItemResponse], summary="Update inventory item stock")
def update_inventory_item(payload: InventoryItemUpdate, item_id: str = Path(..., description="Inventory Item ID")):
    item = repo.get_by_id(item_id)
    if not item or item.get("is_deleted"):
        raise EntityNotFoundException("Inventory Item", item_id)

    update_dict = payload.model_dump(exclude_unset=True)
    if "current_quantity" in update_dict or "min_threshold" in update_dict:
        new_qty = update_dict.get("current_quantity", item.get("current_quantity", item.get("stockQty", 0.0)))
        new_thresh = update_dict.get("min_threshold", item.get("min_threshold", item.get("minThreshold", 10.0)))
        update_dict["is_low_stock"] = new_qty <= new_thresh

    now_str = datetime.now(timezone.utc).isoformat()
    update_dict["updated_at"] = now_str
    updated = repo.update(item_id, update_dict)

    qty = float(updated.get("current_quantity") if updated.get("current_quantity") is not None else updated.get("stockQty", 0.0))
    thresh = float(updated.get("min_threshold") if updated.get("min_threshold") is not None else updated.get("minThreshold", 10.0))

    res = InventoryItemResponse(
        id=item_id,
        name=str(updated.get("name", item.get("name", "Item"))),
        category=str(updated.get("category", item.get("category", "General"))),
        current_quantity=qty,
        unit=str(updated.get("unit", item.get("unit", "pcs"))),
        min_threshold=thresh,
        unit_cost=float(updated.get("unit_cost", 0.0)),
        is_low_stock=qty <= thresh,
        is_deleted=False,
        created_at=datetime.fromisoformat(str(updated.get("created_at", now_str)).replace("Z", "+00:00")),
        updated_at=datetime.fromisoformat(now_str.replace("Z", "+00:00"))
    )
    return ApiResponse.ok(data=res, message="Inventory stock updated successfully")

@router.delete("/{item_id}", response_model=ApiResponse[dict], summary="Delete inventory item")
def delete_inventory_item(item_id: str = Path(..., description="Inventory Item ID")):
    item = repo.get_by_id(item_id)
    if not item or item.get("is_deleted"):
        raise EntityNotFoundException("Inventory Item", item_id)
    repo.update(item_id, {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()})
    return ApiResponse.ok(data={"item_id": item_id, "is_deleted": True}, message="Inventory item deleted successfully")
