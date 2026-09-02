from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict


class NormalizedFinding(BaseModel):
    rule_id: str
    title: str
    description: str
    category: str  # Bug, Code Smell, Security Vulnerability, Performance, Maintainability, Reliability
    severity: str  # Critical, High, Medium, Low, Informational
    file_path: str
    line_number: Optional[int] = None
    column_number: Optional[int] = None
    code_snippet: Optional[str] = None
    suggested_fix: Optional[str] = None


class AnalysisPreview(BaseModel):
    tool: str
    filename: str
    total_findings: int
    security_vulnerabilities: int
    code_smells: int
    other_findings: int
    findings: List[NormalizedFinding]


class AnalysisRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    tool: str
    filename: str
    imported_at: datetime
    total_findings: int
    files_analyzed: int = 0
    status: str


class VulnerabilityHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vulnerability_id: int
    old_status: str
    new_status: str
    note: Optional[str] = None
    changed_at: datetime


class VulnerabilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    finding_id: int
    status: str
    resolution: Optional[str] = None
    resolution_source: Optional[str] = "Manual"  # "Manual" | "Automatic Scan Verification"
    resolution_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    history: List[VulnerabilityHistoryOut] = []


class FindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    analysis_run_id: int
    rule_id: str
    title: str
    description: str
    category: str
    severity: str
    file_path: str
    line_number: Optional[int] = None
    column_number: Optional[int] = None
    code_snippet: Optional[str] = None
    suggested_fix: Optional[str] = None
    fingerprint: str
    created_at: datetime
    vulnerability: Optional[VulnerabilityOut] = None


class VulnerabilityStatusUpdate(BaseModel):
    status: str  # OPEN, IN PROGRESS, RESOLVED
    resolution: Optional[str] = None  # Fixed, False Positive, Ignored
    resolution_source: Optional[str] = "Manual"
    note: Optional[str] = None


class DashboardMetrics(BaseModel):
    total_findings: int
    code_smells_count: int
    security_vulnerabilities_count: int
    open_vulnerabilities: int
    resolved_vulnerabilities: int
    findings_by_category: Dict[str, int]
    vulnerabilities_by_severity: Dict[str, int]
    vulnerability_status: Dict[str, int]
    code_smell_distribution: Dict[str, int]


class CodeSmellCategorySummary(BaseModel):
    category: str
    count: int
    affected_files_count: int
    findings: List[FindingOut] = []
