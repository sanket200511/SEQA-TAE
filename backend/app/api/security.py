from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Vulnerability, Finding, AnalysisRun
from app.schemas.finding import VulnerabilityOut, VulnerabilityStatusUpdate, FindingOut
from app.services.analysis import update_vulnerability_status

router = APIRouter(prefix="/api/security", tags=["Security Vulnerabilities"])


@router.get("", response_model=List[FindingOut])
def list_vulnerabilities(
    project_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Lists security findings strictly scoped to project_id. Returns [] if no project selected."""
    if not project_id:
        return []

    query = (
        db.query(Finding)
        .join(Vulnerability)
        .join(AnalysisRun)
        .filter(AnalysisRun.project_id == project_id)
        .filter(Finding.category == "Security Vulnerability")
    )

    if status_filter:
        query = query.filter(Vulnerability.status == status_filter.upper())
    if severity:
        query = query.filter(Finding.severity == severity)

    return query.order_by(Finding.id.desc()).all()


@router.get("/{vuln_id}", response_model=VulnerabilityOut)
def get_vulnerability_details(vuln_id: int, db: Session = Depends(get_db)):
    """Fetches single vulnerability with resolution state and timeline audit history."""
    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return vuln


@router.patch("/{vuln_id}/status", response_model=VulnerabilityOut)
def update_vulnerability(
    vuln_id: int,
    payload: VulnerabilityStatusUpdate,
    db: Session = Depends(get_db)
):
    """Updates vulnerability status (OPEN -> IN PROGRESS -> RESOLVED) with resolution note and audit trail entry."""
    try:
        updated_vuln = update_vulnerability_status(
            db=db,
            vuln_id=vuln_id,
            new_status=payload.status,
            resolution=payload.resolution,
            resolution_source=payload.resolution_source or "Manual",
            note=payload.note
        )
        return updated_vuln
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error updating vulnerability: {str(e)}")
