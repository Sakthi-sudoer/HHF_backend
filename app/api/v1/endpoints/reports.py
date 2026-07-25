from datetime import date
from typing import Optional
from fastapi import APIRouter, Query, Response, status
from app.models.response import ApiResponse
from app.models.reports import FullReportDataResponse
from app.services.reports_engine import ReportsEngine

router = APIRouter(prefix="/reports", tags=["Reports & Analytics Engine"])
engine = ReportsEngine()

@router.get("", response_model=ApiResponse[FullReportDataResponse], summary="Get full ERP report analytics")
def get_full_reports(
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    customer_id: Optional[str] = Query(None, description="Customer ID filter"),
    payment_status: Optional[str] = Query(None, description="Payment status filter"),
    payment_mode: Optional[str] = Query(None, description="Payment mode filter"),
    subscription_type: Optional[str] = Query(None, description="Subscription type filter")
):
    """
    Retrieves aggregated ERP reports (Invoices, Collections, Outstanding Balances, Payment Modes, Subscriptions, Monthly Revenue & Profit).
    """
    report_data = engine.generate_full_report_data(
        start_date=start_date,
        end_date=end_date,
        customer_id=customer_id,
        payment_status=payment_status,
        payment_mode=payment_mode,
        subscription_type=subscription_type
    )
    return ApiResponse.ok(data=report_data, message="Reports retrieved successfully")

@router.get("/export/csv", summary="Export full reports to CSV")
def export_reports_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """
    Exports full financial invoice and collection report data into downloadable CSV format.
    """
    csv_content = engine.export_report_csv(start_date=start_date, end_date=end_date)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=hhf_reports_{date.today().isoformat()}.csv"}
    )
