import uuid
from datetime import datetime, date, timezone
from typing import List, Optional
from fastapi import APIRouter, Query, Path, status
from app.models.response import ApiResponse
from app.models.expense import ExpenseCreate, ExpenseResponse
from app.repositories.expense_repository import ExpenseRepository
from app.core.exceptions import EntityNotFoundException

router = APIRouter(prefix="/expenses", tags=["Expense Tracking"])
repo = ExpenseRepository()

@router.post("", response_model=ApiResponse[ExpenseResponse], status_code=status.HTTP_201_CREATED, summary="Record an operational expense")
def create_expense(payload: ExpenseCreate):
    """
    Records an operational expense (Groceries, Vegetables, Milk, Packaging, Transport, Salaries, Utilities).
    """
    exp_id = f"exp_{uuid.uuid4().hex[:10]}"
    now_str = datetime.now(timezone.utc).isoformat()
    exp_dict = {
        "id": exp_id,
        "date": payload.date.isoformat(),
        "category": payload.category,
        "amount": payload.amount,
        "description": payload.description,
        "paid_to": payload.paid_to,
        "is_deleted": False,
        "created_at": now_str,
        "updated_at": now_str
    }
    repo.create(exp_id, exp_dict)
    res = ExpenseResponse(
        id=exp_id,
        date=payload.date,
        category=payload.category,
        amount=payload.amount,
        description=payload.description,
        paid_to=payload.paid_to,
        created_at=datetime.fromisoformat(now_str.replace("Z", "+00:00"))
    )
    return ApiResponse.ok(data=res, message="Expense recorded successfully")

@router.get("", response_model=ApiResponse[List[ExpenseResponse]], summary="List recorded expenses")
def list_expenses():
    """
    Retrieves all active operational expenses (supporting both legacy & new Firestore formats).
    """
    records = repo.list_all()
    now_dt = datetime.now(timezone.utc)
    res = []
    for r in records:
        if r.get("is_deleted", False):
            continue
        try:
            exp_date = date.fromisoformat(str(r["date"])) if r.get("date") else date.today()
        except Exception:
            exp_date = date.today()
        
        created_at = now_dt
        if r.get("created_at"):
            try:
                created_at = datetime.fromisoformat(str(r["created_at"]).replace("Z", "+00:00"))
            except Exception:
                pass

        res.append(ExpenseResponse(
            id=str(r.get("id", "exp_unk")),
            date=exp_date,
            category=str(r.get("category", "groceries")).lower(),
            amount=float(r.get("amount", 0.0)),
            description=str(r.get("description") or r.get("item") or "Expense"),
            paid_to=r.get("paid_to"),
            created_at=created_at
        ))
    return ApiResponse.ok(data=res, message="Expenses retrieved")

@router.put("/{expense_id}", response_model=ApiResponse[ExpenseResponse], summary="Update operational expense")
def update_expense(payload: ExpenseCreate, expense_id: str = Path(..., description="Expense ID")):
    """
    Updates details of an existing operational expense record.
    """
    exp = repo.get_by_id(expense_id)
    if not exp or exp.get("is_deleted"):
        raise EntityNotFoundException("Expense", expense_id)

    now_str = datetime.now(timezone.utc).isoformat()
    update_dict = {
        "date": payload.date.isoformat(),
        "category": payload.category,
        "amount": payload.amount,
        "description": payload.description,
        "paid_to": payload.paid_to,
        "updated_at": now_str
    }
    updated = repo.update(expense_id, update_dict)
    res = ExpenseResponse(
        id=expense_id,
        date=payload.date,
        category=payload.category,
        amount=payload.amount,
        description=payload.description,
        paid_to=payload.paid_to,
        created_at=datetime.fromisoformat(str(updated.get("created_at", now_str)).replace("Z", "+00:00"))
    )
    return ApiResponse.ok(data=res, message="Expense updated successfully")

@router.delete("/{expense_id}", response_model=ApiResponse[dict], summary="Soft-delete expense")
def delete_expense(expense_id: str = Path(..., description="Expense ID")):
    """
    Soft-deletes an operational expense record (sets is_deleted = True).
    """
    exp = repo.get_by_id(expense_id)
    if not exp or exp.get("is_deleted"):
        raise EntityNotFoundException("Expense", expense_id)
    repo.update(expense_id, {"is_deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()})
    return ApiResponse.ok(data={"expense_id": expense_id, "is_deleted": True}, message="Expense deleted successfully")
