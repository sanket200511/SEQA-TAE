from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Finding, AnalysisRun

router = APIRouter(prefix="/api/code-smells", tags=["Code Smells"])


@router.get("")
def get_code_smells_summary(
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves categorization summary of code smells strictly scoped to project_id. Returns empty if project_id is None."""
    if not project_id:
        return {
            "total_code_smells": 0,
            "smell_categories": [],
            "hotspot_files": []
        }

    query = db.query(Finding).join(AnalysisRun).filter(AnalysisRun.project_id == project_id).filter(Finding.category == "Code Smell")
    smell_findings = query.all()

    categories: Dict[str, List[dict]] = {}
    hotspot_files: Dict[str, int] = {}

    for f in smell_findings:
        subcat = f.title.split(":")[0] if ":" in f.title else "General Code Smell"
        
        if subcat not in categories:
            categories[subcat] = []
        
        finding_dict = {
            "id": f.id,
            "rule_id": f.rule_id,
            "title": f.title,
            "severity": f.severity,
            "file_path": f.file_path,
            "line_number": f.line_number,
            "description": f.description,
            "suggested_fix": f.suggested_fix
        }
        categories[subcat].append(finding_dict)

        file_p = f.file_path
        hotspot_files[file_p] = hotspot_files.get(file_p, 0) + 1

    summary = []
    for subcat, findings_list in categories.items():
        unique_files = len(set(item["file_path"] for item in findings_list))
        summary.append({
            "category": subcat,
            "count": len(findings_list),
            "affected_files_count": unique_files,
            "findings": findings_list
        })

    sorted_hotspots = sorted(
        [{"file": file, "count": count} for file, count in hotspot_files.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:10]

    return {
        "total_code_smells": len(smell_findings),
        "smell_categories": summary,
        "hotspot_files": sorted_hotspots
    }
