import os
from pathlib import Path
from urllib.parse import urlparse
import psycopg
from dotenv import load_dotenv

load_dotenv()

SAMPLE_LOGS_DIR = Path(__file__).resolve().parent.parent / "sample_logs"


def ensure_database_exists():
    db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:sanket2005@localhost:5432/codelens")
    clean_url = db_url.replace("postgresql+psycopg://", "postgresql://")
    parsed = urlparse(clean_url)
    
    db_name = parsed.path.lstrip('/') or "codelens"
    user = parsed.username or "postgres"
    password = parsed.password or "sanket2005"
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432

    try:
        conn = psycopg.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port=port,
            autocommit=True
        )
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
            exists = cur.fetchone()
            if not exists:
                print(f"Creating database '{db_name}'...")
                cur.execute(f'CREATE DATABASE "{db_name}"')
                print(f"Database '{db_name}' created successfully.")
        conn.close()
    except Exception as e:
        print(f"Note on database auto-creation check: {e}")


def seed_database():
    ensure_database_exists()

    from app.database.session import SessionLocal, Base, engine
    from app.services.analysis import import_analysis, update_vulnerability_status
    from app.models.entities import Project, Vulnerability

    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create a specific Sample Demo Project for seeded sample reports
        sample_proj = db.query(Project).filter(Project.name == "Sample Demo Project").first()
        if not sample_proj:
            sample_proj = Project(
                name="Sample Demo Project",
                description="Demo space populated with sample static analysis logs for exploration",
                primary_language="Python / JavaScript"
            )
            db.add(sample_proj)
            db.commit()
            db.refresh(sample_proj)

        sample_files = [
            ("bandit-report.json", "Bandit"),
            ("eslint-report.json", "ESLint"),
            ("semgrep-report.json", "Semgrep"),
            ("pylint-report.json", "Pylint"),
            ("sample-findings.csv", "CSV"),
        ]

        print("Seeding sample static analysis runs into 'Sample Demo Project'...")
        for filename, tool_name in sample_files:
            file_path = SAMPLE_LOGS_DIR / filename
            if file_path.exists():
                with open(file_path, "rb") as f:
                    content = f.read()
                print(f"  -> Importing {filename} ({tool_name})...")
                import_analysis(
                    db,
                    content=content,
                    filename=filename,
                    project_id=sample_proj.id,
                    tool_name=tool_name
                )

        # Update a couple of vulnerabilities to IN PROGRESS and RESOLVED to demonstrate lifecycle tracking
        vulns = db.query(Vulnerability).all()
        if len(vulns) >= 2:
            print("Seeding vulnerability resolution history...")
            update_vulnerability_status(
                db,
                vuln_id=vulns[0].id,
                new_status="IN PROGRESS",
                note="Assigned to Security Team for remediation."
            )
            update_vulnerability_status(
                db,
                vuln_id=vulns[0].id,
                new_status="RESOLVED",
                resolution="Fixed",
                resolution_source="Manual",
                note="Replaced hardcoded credentials with environment variables."
            )
            if len(vulns) >= 3:
                update_vulnerability_status(
                    db,
                    vuln_id=vulns[1].id,
                    new_status="IN PROGRESS",
                    note="Refactoring raw SQL string formatting into parameterized SQLAlchemy queries."
                )

        print("\nDatabase seeded successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
