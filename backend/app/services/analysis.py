from datetime import datetime
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.entities import Project, AnalysisRun, Finding, Vulnerability, VulnerabilityHistory
from app.schemas.finding import (
    NormalizedFinding,
    AnalysisPreview,
    DashboardMetrics,
    CodeSmellCategorySummary,
)
from app.parsers.registry import registry
from app.services.fingerprint import generate_fingerprint


def get_or_create_default_project(db: Session) -> Project:
    """Ensures at least one active project exists for default operations."""
    proj = db.query(Project).first()
    if not proj:
        proj = Project(
            name="Default Project",
            description="Initial default project space",
            primary_language="Python",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(proj)
        db.commit()
        db.refresh(proj)
    return proj


def preview_analysis(content: bytes, filename: str, tool_name: Optional[str] = None) -> AnalysisPreview:
    """Parses analysis log file and returns a preview of findings before saving to DB."""
    if tool_name and tool_name.strip() and tool_name.lower() != "auto":
        findings = registry.parse_with_tool(tool_name, content, filename)
        detected_tool = tool_name
    else:
        detected_tool, findings = registry.auto_detect_and_parse(content, filename)

    sec_count = sum(1 for f in findings if f.category == "Security Vulnerability")
    smell_count = sum(1 for f in findings if f.category == "Code Smell")
    other_count = len(findings) - sec_count - smell_count

    return AnalysisPreview(
        tool=detected_tool,
        filename=filename,
        total_findings=len(findings),
        security_vulnerabilities=sec_count,
        code_smells=smell_count,
        other_findings=other_count,
        findings=findings
    )


def import_analysis(
    db: Session,
    content: bytes,
    filename: str,
    project_id: Optional[int] = None,
    tool_name: Optional[str] = None
) -> AnalysisRun:
    """
    Parses findings, saves AnalysisRun and Findings scoped to project_id,
    and performs SAFE auto-resolution and regression re-detection.
    """
    if not project_id:
        default_proj = get_or_create_default_project(db)
        project_id = default_proj.id
    else:
        proj = db.query(Project).filter(Project.id == project_id).first()
        if not proj:
            raise ValueError(f"Project with ID {project_id} not found.")

    if tool_name and tool_name.strip() and tool_name.lower() != "auto":
        findings = registry.parse_with_tool(tool_name, content, filename)
        detected_tool = tool_name
    else:
        detected_tool, findings = registry.auto_detect_and_parse(content, filename)

    unique_files = len(set(f.file_path for f in findings)) if findings else 0

    run = AnalysisRun(
        project_id=project_id,
        tool=detected_tool,
        filename=filename,
        imported_at=datetime.utcnow(),
        total_findings=len(findings),
        files_analyzed=unique_files,
        status="Completed"
    )
    db.add(run)
    db.flush()

    new_scan_fingerprints = set()
    
    for nf in findings:
        fp = generate_fingerprint(
            tool=detected_tool,
            rule_id=nf.rule_id,
            file_path=nf.file_path,
            code_snippet=nf.code_snippet,
            line_number=nf.line_number
        )
        new_scan_fingerprints.add(fp)

        finding_db = Finding(
            analysis_run_id=run.id,
            rule_id=nf.rule_id,
            title=nf.title,
            description=nf.description,
            category=nf.category,
            severity=nf.severity,
            file_path=nf.file_path,
            line_number=nf.line_number,
            column_number=nf.column_number,
            code_snippet=nf.code_snippet,
            suggested_fix=nf.suggested_fix,
            fingerprint=fp,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(finding_db)
        db.flush()

        # If security vulnerability, link or handle state transition
        if nf.category == "Security Vulnerability":
            # Search for existing vulnerability in this project with matching fingerprint
            existing_vuln = (
                db.query(Vulnerability)
                .join(Finding)
                .join(AnalysisRun)
                .filter(AnalysisRun.project_id == project_id)
                .filter(AnalysisRun.tool == detected_tool)
                .filter(Finding.fingerprint == fp)
                .first()
            )

            if existing_vuln:
                # If previously resolved, re-detect regression!
                if existing_vuln.status == "RESOLVED":
                    old_status = existing_vuln.status
                    existing_vuln.status = "OPEN"
                    existing_vuln.resolution_source = None
                    existing_vuln.resolution = None
                    existing_vuln.updated_at = datetime.utcnow()
                    existing_vuln.resolved_at = None

                    history_entry = VulnerabilityHistory(
                        vulnerability_id=existing_vuln.id,
                        old_status=old_status,
                        new_status="OPEN",
                        note=f"Regression detected: Vulnerability reappeared in scan '{filename}'",
                        changed_at=datetime.utcnow()
                    )
                    db.add(history_entry)
            else:
                # Create new vulnerability entry
                vuln = Vulnerability(
                    finding_id=finding_db.id,
                    status="OPEN",
                    resolution_source="Manual",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(vuln)
                db.flush()

                history_entry = VulnerabilityHistory(
                    vulnerability_id=vuln.id,
                    old_status="NONE",
                    new_status="OPEN",
                    note=f"Initial vulnerability detection in scan '{filename}'",
                    changed_at=datetime.utcnow()
                )
                db.add(history_entry)

    # -------------------------------------------------------------
    # SAFE AUTO-RESOLUTION LOGIC across scans in the SAME project
    # -------------------------------------------------------------
    previous_completed_scans = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.project_id == project_id)
        .filter(AnalysisRun.tool == detected_tool)
        .filter(AnalysisRun.status == "Completed")
        .filter(AnalysisRun.id != run.id)
        .count()
    )

    if previous_completed_scans > 0 and run.status == "Completed":
        active_vulns = (
            db.query(Vulnerability)
            .join(Finding)
            .join(AnalysisRun)
            .filter(AnalysisRun.project_id == project_id)
            .filter(AnalysisRun.tool == detected_tool)
            .filter(or_(Vulnerability.status == "OPEN", Vulnerability.status == "IN PROGRESS"))
            .all()
        )

        for active_v in active_vulns:
            if active_v.finding and active_v.finding.fingerprint not in new_scan_fingerprints:
                old_status = active_v.status
                active_v.status = "RESOLVED"
                active_v.resolution = "Fixed"
                active_v.resolution_source = "Automatic Scan Verification"
                active_v.resolution_note = "Finding no longer detected in subsequent comparable scan."
                active_v.resolved_at = datetime.utcnow()
                active_v.updated_at = datetime.utcnow()

                h_entry = VulnerabilityHistory(
                    vulnerability_id=active_v.id,
                    old_status=old_status,
                    new_status="RESOLVED",
                    note=f"Automatically resolved: Issue no longer detected in comparable scan '{filename}'",
                    changed_at=datetime.utcnow()
                )
                db.add(h_entry)

    db.commit()
    db.refresh(run)
    return run


def update_vulnerability_status(
    db: Session,
    vuln_id: int,
    new_status: str,
    resolution: Optional[str] = None,
    resolution_source: Optional[str] = "Manual",
    note: Optional[str] = None
) -> Vulnerability:
    """Updates vulnerability status (OPEN -> IN PROGRESS -> RESOLVED) and creates audit trail entry."""
    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        raise ValueError(f"Vulnerability with ID {vuln_id} not found.")

    old_status = vuln.status
    normalized_new_status = new_status.upper().strip()

    vuln.status = normalized_new_status
    vuln.resolution_source = resolution_source or "Manual"
    vuln.updated_at = datetime.utcnow()

    if resolution:
        vuln.resolution = resolution
    if note:
        vuln.resolution_note = note

    if normalized_new_status == "RESOLVED":
        vuln.resolved_at = datetime.utcnow()
    elif old_status == "RESOLVED" and normalized_new_status != "RESOLVED":
        vuln.resolved_at = None

    history = VulnerabilityHistory(
        vulnerability_id=vuln.id,
        old_status=old_status,
        new_status=normalized_new_status,
        note=note or f"Status manually changed from {old_status} to {normalized_new_status}",
        changed_at=datetime.utcnow()
    )
    db.add(history)
    db.commit()
    db.refresh(vuln)
    return vuln


def get_dashboard_metrics(db: Session, project_id: Optional[int] = None) -> DashboardMetrics:
    """Calculates summary statistics and distribution metrics for the SQA dashboard strictly filtered by project."""
    if not project_id:
        return DashboardMetrics(
            total_findings=0,
            code_smells_count=0,
            security_vulnerabilities_count=0,
            open_vulnerabilities=0,
            resolved_vulnerabilities=0,
            findings_by_category={},
            vulnerabilities_by_severity={},
            vulnerability_status={"OPEN": 0, "IN PROGRESS": 0, "RESOLVED": 0},
            code_smell_distribution={}
        )

    finding_query = db.query(Finding).join(AnalysisRun).filter(AnalysisRun.project_id == project_id)
    vuln_query = db.query(Vulnerability).join(Finding).join(AnalysisRun).filter(AnalysisRun.project_id == project_id)

    total_findings = finding_query.count()
    smells_count = finding_query.filter(Finding.category == "Code Smell").count()
    sec_count = finding_query.filter(Finding.category == "Security Vulnerability").count()

    open_vulns = vuln_query.filter(Vulnerability.status == "OPEN").count()
    in_progress_vulns = vuln_query.filter(Vulnerability.status == "IN PROGRESS").count()
    resolved_vulns = vuln_query.filter(Vulnerability.status == "RESOLVED").count()

    # Findings by Category
    cat_rows = (
        db.query(Finding.category, func.count(Finding.id))
        .join(AnalysisRun)
        .filter(AnalysisRun.project_id == project_id)
        .group_by(Finding.category)
        .all()
    )
    cat_dict = {cat: count for cat, count in cat_rows}

    # Vulnerabilities by Severity
    sev_rows = (
        db.query(Finding.severity, func.count(Vulnerability.id))
        .join(Vulnerability, Finding.id == Vulnerability.finding_id)
        .join(AnalysisRun, Finding.analysis_run_id == AnalysisRun.id)
        .filter(AnalysisRun.project_id == project_id)
        .group_by(Finding.severity)
        .all()
    )
    sev_dict = {sev: count for sev, count in sev_rows}

    status_dict = {
        "OPEN": open_vulns,
        "IN PROGRESS": in_progress_vulns,
        "RESOLVED": resolved_vulns
    }

    # Code Smell Distribution
    smell_findings = (
        db.query(Finding.title)
        .join(AnalysisRun)
        .filter(Finding.category == "Code Smell")
        .filter(AnalysisRun.project_id == project_id)
        .all()
    )
    smell_dist: Dict[str, int] = {}
    for (t,) in smell_findings:
        subcat = t.split(":")[0] if ":" in t else t
        smell_dist[subcat] = smell_dist.get(subcat, 0) + 1

    return DashboardMetrics(
        total_findings=total_findings,
        code_smells_count=smells_count,
        security_vulnerabilities_count=sec_count,
        open_vulnerabilities=open_vulns,
        resolved_vulnerabilities=resolved_vulns,
        findings_by_category=cat_dict,
        vulnerabilities_by_severity=sev_dict,
        vulnerability_status=status_dict,
        code_smell_distribution=smell_dist
    )
