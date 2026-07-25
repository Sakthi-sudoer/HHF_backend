from datetime import date
from fastapi import APIRouter, Query, Response
from app.models.response import ApiResponse
from app.models.reports import FinancialReportSummary
from app.services.reports_engine import ReportsEngine

router = APIRouter(prefix="/reports", tags=["Reports Engine"])
engine = ReportsEngine()

@router.get("/financial", response_model=ApiResponse[FinancialReportSummary], summary="Generate financial & operational report")
def get_financial_report(
    start_date: date = Query(..., description="Report start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Report end date (YYYY-MM-DD)")
):
    """
    Generates detailed daily, weekly, or monthly financial and meal delivery breakdown reports.
    """
    result = engine.generate_financial_report(start_date, end_date)
    return ApiResponse.ok(data=result, message=f"Financial report from {start_date} to {end_date} generated")

@router.get("/export/csv", summary="Export report as CSV")
def export_report_csv(
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date")
):
    """
    Exports report metrics to a downloadable CSV file.
    """
    csv_content = engine.export_report_csv(start_date, end_date)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{start_date}_to_{end_date}.csv"}
    )
