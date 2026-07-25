from fastapi import APIRouter
from app.api.v1.endpoints import (
    customers, subscriptions, deliveries, invoices, ledger, payments, expenses, dashboard, reports, settings
)

api_router = APIRouter()

api_router.include_router(dashboard.router)
api_router.include_router(customers.router)
api_router.include_router(subscriptions.router)
api_router.include_router(deliveries.router)
api_router.include_router(invoices.router)
api_router.include_router(ledger.router)
api_router.include_router(payments.router)
api_router.include_router(expenses.router)
api_router.include_router(reports.router)
api_router.include_router(settings.router)
