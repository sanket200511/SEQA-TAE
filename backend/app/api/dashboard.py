from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.finding import DashboardMetrics
from app.services.analysis import get_dashboard_metrics

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardMetrics)
def get_dashboard_data(
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns summarized SQA dashboard metrics, chart series, and resolution status counters for a project."""
    return get_dashboard_metrics(db, project_id=project_id)
