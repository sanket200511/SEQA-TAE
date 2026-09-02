from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db
from app.models.entities import Finding, Vulnerability, AnalysisRun
from app.schemas.finding import FindingOut

router = APIRouter(prefix="/api/findings", tags=["Findings"])


@router.get("", response_model=List[FindingOut])
def list_findings(
    project_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    tool: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieves list of findings strictly scoped to project_id. Returns [] if no project selected."""
    if not project_id:
        return []

    query = db.query(Finding).join(AnalysisRun).filter(AnalysisRun.project_id == project_id)

    if category:
        query = query.filter(Finding.category == category)
    if severity:
        query = query.filter(Finding.severity == severity)
    if tool:
        query = query.filter(AnalysisRun.tool == tool)

    if status:
        query = query.outerjoin(Vulnerability).filter(Vulnerability.status == status.upper())

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Finding.rule_id.ilike(search_term),
                Finding.title.ilike(search_term),
                Finding.description.ilike(search_term),
                Finding.file_path.ilike(search_term)
            )
        )

    return query.order_by(Finding.id.desc()).offset(offset).limit(limit).all()


@router.get("/{finding_id}", response_model=FindingOut)
def get_finding(finding_id: int, db: Session = Depends(get_db)):
    """Retrieves detailed finding by ID including vulnerability status if applicable."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding
