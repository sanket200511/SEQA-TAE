import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.models.entities import Project, Vulnerability, VulnerabilityHistory, Finding, AnalysisRun
from app.services.analysis import import_analysis, update_vulnerability_status, get_dashboard_metrics

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()


def test_real_project_end_to_end_workflow(db_session):
    # 1. Create a Project A
    proj_a = Project(name="Test Python Project A", primary_language="Python")
    db_session.add(proj_a)
    db_session.commit()
    db_session.refresh(proj_a)

    # 2. First Scan for Project A: Contains B105 and B608
    scan_1_json = """
    {
      "results": [
        {
          "test_id": "B105",
          "test_name": "hardcoded_password_string",
          "issue_text": "Possible hardcoded password",
          "issue_severity": "HIGH",
          "filename": "config.py",
          "line_number": 17,
          "code": "PASSWORD = 'admin_secret'"
        },
        {
          "test_id": "B608",
          "test_name": "hardcoded_sql_expression",
          "issue_text": "Possible SQL injection vector",
          "issue_severity": "HIGH",
          "filename": "database.py",
          "line_number": 42,
          "code": "query = 'SELECT * FROM users WHERE id=' + uid"
        }
      ]
    }
    """
    run_1 = import_analysis(db_session, scan_1_json.encode("utf-8"), "bandit-report-1.json", project_id=proj_a.id, tool_name="Bandit")
    assert run_1.total_findings == 2

    # 3. Create Project B (Starts empty)
    proj_b = Project(name="Test Project B", primary_language="TypeScript")
    db_session.add(proj_b)
    db_session.commit()
    db_session.refresh(proj_b)

    # Verify Project B metrics are strictly 0
    metrics_b = get_dashboard_metrics(db_session, project_id=proj_b.id)
    assert metrics_b.total_findings == 0
    assert metrics_b.code_smells_count == 0
    assert metrics_b.security_vulnerabilities_count == 0

    # Verify no project selected (project_id=None) metrics are strictly 0
    metrics_none = get_dashboard_metrics(db_session, project_id=None)
    assert metrics_none.total_findings == 0
    assert metrics_none.code_smells_count == 0
    assert metrics_none.security_vulnerabilities_count == 0

    # 4. Manual Resolution in Project A
    vulns_a = db_session.query(Vulnerability).join(Finding).join(AnalysisRun).filter(AnalysisRun.project_id == proj_a.id).all()
    assert len(vulns_a) == 2

    b105_vuln = next(v for v in vulns_a if v.finding.rule_id == "B105")
    updated_b105 = update_vulnerability_status(
        db_session,
        vuln_id=b105_vuln.id,
        new_status="RESOLVED",
        resolution="Fixed",
        resolution_source="Manual",
        note="Moved hardcoded password to environment variable."
    )
    assert updated_b105.status == "RESOLVED"

    # 5. Second Scan for Project A: B608 is fixed (absent)
    scan_2_json = '{"results": []}'
    run_2 = import_analysis(db_session, scan_2_json.encode("utf-8"), "bandit-report-2.json", project_id=proj_a.id, tool_name="Bandit")
    assert run_2.total_findings == 0

    b608_vuln = db_session.query(Vulnerability).filter(Vulnerability.id != b105_vuln.id).first()
    db_session.refresh(b608_vuln)
    assert b608_vuln.status == "RESOLVED"
    assert b608_vuln.resolution_source == "Automatic Scan Verification"

    # 6. Verify Project B STILL has 0 findings (no leak from Project A)
    findings_b = db_session.query(Finding).join(AnalysisRun).filter(AnalysisRun.project_id == proj_b.id).all()
    assert len(findings_b) == 0
