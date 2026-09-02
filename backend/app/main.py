import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api import (
    projects_router,
    analysis_router,
    findings_router,
    security_router,
    code_smells_router,
    dashboard_router,
    compare_router
)

load_dotenv()

app = FastAPI(
    title="CodeLens API",
    description="Static Code Analysis Log Visualizer & Vulnerability Tracking API",
    version="1.1.0"
)

# Configure CORS dynamically from FRONTEND_URL or CORS_ORIGINS
frontend_url = os.getenv("FRONTEND_URL", "").strip()
cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

if frontend_url:
    origins.extend([u.strip() for u in frontend_url.split(",") if u.strip()])

if cors_origins_env:
    origins.extend([u.strip() for u in cors_origins_env.split(",") if u.strip()])

# Deduplicate origins while preserving order
allowed_origins = list(dict.fromkeys(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(projects_router)
app.include_router(analysis_router)
app.include_router(findings_router)
app.include_router(security_router)
app.include_router(code_smells_router)
app.include_router(dashboard_router)
app.include_router(compare_router)


@app.get("/health")
def health_check():
    """Unauthenticated health check endpoint for deployment monitoring."""
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "app": "CodeLens — Static Code Analysis Log Visualizer",
        "status": "healthy",
        "health": "/health",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    reload_flag = os.getenv("ENVIRONMENT", "development").lower() == "development"
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=reload_flag)
