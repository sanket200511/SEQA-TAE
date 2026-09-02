from app.api.projects import router as projects_router
from app.api.analysis import router as analysis_router
from app.api.findings import router as findings_router
from app.api.security import router as security_router
from app.api.code_smells import router as code_smells_router
from app.api.dashboard import router as dashboard_router
from app.api.compare import router as compare_router

__all__ = [
    "projects_router",
    "analysis_router",
    "findings_router",
    "security_router",
    "code_smells_router",
    "dashboard_router",
    "compare_router"
]
