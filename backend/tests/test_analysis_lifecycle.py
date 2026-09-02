import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.services.analysis import import_analysis, update_vulnerability_status
from app.models.entities import Vulnerability, VulnerabilityHistory, Finding

# In-memory SQLite engine for testing lifecycle logic
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()


def test_vulnerability_lifecycle_tracking(db_session):
    bandit_json = """
    {
      "results": [
        {
          "test_id": "B105",
          "test_name": "hardcoded_password_string",
          "issue_text": "Possible hardcoded password",
          "issue_severity": "HIGH",
          "filename": "config.py",
          "line_number": 10,
          "code": "PASSWORD = 'admin'"
        }
      ]
    }
    """
    run = import_analysis(db_session, bandit_json.encode("utf-8"), "test.json", tool_name="Bandit")
    assert run.total_findings == 1

    vuln = db_session.query(Vulnerability).first()
    assert vuln is not None
    assert vuln.status == "OPEN"

    # Advance state: OPEN -> IN PROGRESS
    updated_1 = update_vulnerability_status(db_session, vuln.id, "IN PROGRESS", note="Investigating fix")
    assert updated_1.status == "IN PROGRESS"

    # Advance state: IN PROGRESS -> RESOLVED
    updated_2 = update_vulnerability_status(db_session, vuln.id, "RESOLVED", resolution="Fixed", note="Removed hardcoded string")
    assert updated_2.status == "RESOLVED"
    assert updated_2.resolved_at is not None

    # Check audit history
    history = db_session.query(VulnerabilityHistory).filter(VulnerabilityHistory.vulnerability_id == vuln.id).all()
    assert len(history) == 3  # Initial detection + 2 status changes
