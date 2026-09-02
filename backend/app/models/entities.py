from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    primary_language = Column(String(50), nullable=False, default="Python")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    scans = relationship("AnalysisRun", back_populates="project", cascade="all, delete-orphan")


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    tool = Column(String(50), nullable=False)
    filename = Column(String(255), nullable=False)
    imported_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    total_findings = Column(Integer, default=0, nullable=False)
    files_analyzed = Column(Integer, default=0, nullable=False)
    status = Column(String(20), default="Completed", nullable=False)

    project = relationship("Project", back_populates="scans")
    findings = relationship("Finding", back_populates="analysis_run", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    analysis_run_id = Column(Integer, ForeignKey("analysis_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    rule_id = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    category = Column(String(50), nullable=False, index=True)  # Bug, Code Smell, Security Vulnerability, etc.
    severity = Column(String(20), nullable=False, index=True)  # Critical, High, Medium, Low, Informational

    file_path = Column(String(500), nullable=False, index=True)
    line_number = Column(Integer, nullable=True)
    column_number = Column(Integer, nullable=True)

    code_snippet = Column(Text, nullable=True)
    suggested_fix = Column(Text, nullable=True)

    fingerprint = Column(String(64), nullable=False, index=True)  # SHA256 Hash

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    analysis_run = relationship("AnalysisRun", back_populates="findings")
    vulnerability = relationship("Vulnerability", back_populates="finding", uselist=False, cascade="all, delete-orphan")


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey("findings.id", ondelete="CASCADE"), unique=True, nullable=False)

    status = Column(String(20), default="OPEN", nullable=False, index=True)  # OPEN, IN PROGRESS, RESOLVED
    resolution = Column(String(50), nullable=True)  # Fixed, False Positive, Ignored
    resolution_source = Column(String(50), nullable=True, default="Manual")  # Manual vs Automatic Scan Verification
    resolution_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    finding = relationship("Finding", back_populates="vulnerability")
    history = relationship("VulnerabilityHistory", back_populates="vulnerability", cascade="all, delete-orphan", order_by="VulnerabilityHistory.changed_at.desc()")


class VulnerabilityHistory(Base):
    __tablename__ = "vulnerability_history"

    id = Column(Integer, primary_key=True, index=True)
    vulnerability_id = Column(Integer, ForeignKey("vulnerabilities.id", ondelete="CASCADE"), nullable=False)

    old_status = Column(String(20), nullable=False)
    new_status = Column(String(20), nullable=False)
    note = Column(Text, nullable=True)

    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    vulnerability = relationship("Vulnerability", back_populates="history")
