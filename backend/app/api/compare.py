from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import AnalysisRun, Finding
from app.schemas.finding import FindingOut

router = APIRouter(prefix="/api/compare", tags=["Scan Compare"])


@router.get("")
def compare_scans(
    run_a: int = Query(..., description="Previous scan run ID"),
    run_b: int = Query(..., description="Current scan run ID"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Compares findings between two analysis runs to detect New, Resolved, and Persistent issues."""
    scan_a = db.query(AnalysisRun).filter(AnalysisRun.id == run_a).first()
    scan_b = db.query(AnalysisRun).filter(AnalysisRun.id == run_b).first()

    if not scan_a or not scan_b:
        raise HTTPException(status_code=404, detail="One or both analysis runs not found")

    findings_a = db.query(Finding).filter(Finding.analysis_run_id == run_a).all()
    findings_b = db.query(Finding).filter(Finding.analysis_run_id == run_b).all()

    fp_map_a = {f.fingerprint: f for f in findings_a}
    fp_map_b = {f.fingerprint: f for f in findings_b}

    new_fps = set(fp_map_b.keys()) - set(fp_map_a.keys())
    resolved_fps = set(fp_map_a.keys()) - set(fp_map_b.keys())
    persistent_fps = set(fp_map_a.keys()).intersection(set(fp_map_b.keys()))

    new_findings = [FindingOut.model_validate(fp_map_b[fp]) for fp in new_fps]
    resolved_findings = [FindingOut.model_validate(fp_map_a[fp]) for fp in resolved_fps]
    persistent_findings = [FindingOut.model_validate(fp_map_b[fp]) for fp in persistent_fps]

    return {
        "run_a": {
            "id": scan_a.id,
            "filename": scan_a.filename,
            "tool": scan_a.tool,
            "imported_at": scan_a.imported_at,
            "total": len(findings_a)
        },
        "run_b": {
            "id": scan_b.id,
            "filename": scan_b.filename,
            "tool": scan_b.tool,
            "imported_at": scan_b.imported_at,
            "total": len(findings_b)
        },
        "summary": {
            "total_change": len(findings_b) - len(findings_a),
            "new_count": len(new_findings),
            "resolved_count": len(resolved_findings),
            "persistent_count": len(persistent_findings)
        },
        "new_findings": new_findings,
        "resolved_findings": resolved_findings,
        "persistent_findings": persistent_findings
    }
