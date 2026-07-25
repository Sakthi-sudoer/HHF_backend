import uuid
from datetime import datetime, date, timezone
from typing import List
from fastapi import APIRouter, Query, status
from app.models.response import ApiResponse
from app.models.expense import ExpenseCreate, ExpenseResponse
from app.repositories.expense_repository import ExpenseRepository

router = APIRouter(prefix="/expenses", tags=["Expense Tracking"])
repo = ExpenseRepository()

@router.post("", response_model=ApiResponse[ExpenseResponse], status_code=status.HTTP_201_CREATED, summary="Record a operational expense")
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
        "created_at": now_str
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
    Retrieves all recorded operational expenses.
    """
    records = repo.list_all()
    res = [
        ExpenseResponse(
            id=r["id"],
            date=date.fromisoformat(r["date"]),
            category=r["category"],
            amount=r["amount"],
            description=r["description"],
            paid_to=r.get("paid_to"),
            created_at=datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
        ) for r in records
    ]
    return ApiResponse.ok(data=res, message="Expenses retrieved")
