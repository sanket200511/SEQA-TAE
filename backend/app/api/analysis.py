from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import AnalysisRun, Finding
from app.schemas.finding import AnalysisPreview, AnalysisRunOut, FindingOut
from app.services.analysis import preview_analysis, import_analysis

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.post("/preview", response_model=AnalysisPreview)
async def preview_analysis_file(
    file: UploadFile = File(...),
    tool: Optional[str] = Form(None)
):
    """Uploads static analysis log file and generates preview without saving to database."""
    try:
        content = await file.read()
        return preview_analysis(content=content, filename=file.filename or "uploaded_report", tool_name=tool)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error previewing file: {str(e)}")


@router.post("/import", response_model=AnalysisRunOut)
async def import_analysis_file(
    file: UploadFile = File(...),
    tool: Optional[str] = Form(None),
    project_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """Uploads and parses static analysis log file, persisting findings and performing safe auto-resolution."""
    try:
        content = await file.read()
        run = import_analysis(
            db=db,
            content=content,
            filename=file.filename or "uploaded_report",
            project_id=project_id,
            tool_name=tool
        )
        return run
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error importing analysis: {str(e)}")


@router.get("/history", response_model=List[AnalysisRunOut])
def get_analysis_history(
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieves all previous analysis import runs for a project ordered by date. Returns [] if project_id is None."""
    if not project_id:
        return []
    return db.query(AnalysisRun).filter(AnalysisRun.project_id == project_id).order_by(AnalysisRun.imported_at.desc()).all()


@router.get("/{run_id}", response_model=AnalysisRunOut)
def get_analysis_run(run_id: int, db: Session = Depends(get_db)):
    """Retrieves details of a specific analysis run by ID."""
    run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    return run


@router.get("/{run_id}/findings", response_model=List[FindingOut])
def get_run_findings(run_id: int, db: Session = Depends(get_db)):
    """Retrieves all findings associated with a specific analysis run."""
    run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    return db.query(Finding).filter(Finding.analysis_run_id == run_id).all()
