"""add projects table and link to analysis runs

Revision ID: 001_add_projects
Revises: 
Create Date: 2026-08-31 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


revision = '001_add_projects'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    tables = inspector.get_table_names()

    # 1. Create projects table if not exists
    if 'projects' not in tables:
        op.create_table(
            'projects',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('primary_language', sa.String(length=50), nullable=False, server_default='Python'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_projects_id'), 'projects', ['id'], unique=False)
        op.create_index(op.f('ix_projects_name'), 'projects', ['name'], unique=False)

    # 2. Create or update analysis_runs table
    if 'analysis_runs' not in tables:
        op.create_table(
            'analysis_runs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('project_id', sa.Integer(), nullable=False),
            sa.Column('tool', sa.String(length=50), nullable=False),
            sa.Column('filename', sa.String(length=255), nullable=False),
            sa.Column('imported_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('total_findings', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('files_analyzed', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='Completed'),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_analysis_runs_id'), 'analysis_runs', ['id'], unique=False)
        op.create_index(op.f('ix_analysis_runs_project_id'), 'analysis_runs', ['project_id'], unique=False)
    else:
        columns_analysis = [c['name'] for c in inspector.get_columns('analysis_runs')]
        if 'project_id' not in columns_analysis:
            op.add_column('analysis_runs', sa.Column('project_id', sa.Integer(), nullable=True))
            op.create_index(op.f('ix_analysis_runs_project_id'), 'analysis_runs', ['project_id'], unique=False)
            op.create_foreign_key('fk_analysis_runs_projects', 'analysis_runs', 'projects', ['project_id'], ['id'], ondelete='CASCADE')
        
        if 'files_analyzed' not in columns_analysis:
            op.add_column('analysis_runs', sa.Column('files_analyzed', sa.Integer(), nullable=False, server_default='0'))

    # 3. Create or update findings table
    if 'findings' not in tables:
        op.create_table(
            'findings',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('analysis_run_id', sa.Integer(), nullable=False),
            sa.Column('rule_id', sa.String(length=100), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('category', sa.String(length=50), nullable=False),
            sa.Column('severity', sa.String(length=20), nullable=False),
            sa.Column('file_path', sa.String(length=500), nullable=False),
            sa.Column('line_number', sa.Integer(), nullable=True),
            sa.Column('column_number', sa.Integer(), nullable=True),
            sa.Column('code_snippet', sa.Text(), nullable=True),
            sa.Column('suggested_fix', sa.Text(), nullable=True),
            sa.Column('fingerprint', sa.String(length=64), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['analysis_run_id'], ['analysis_runs.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_findings_id'), 'findings', ['id'], unique=False)
        op.create_index(op.f('ix_findings_analysis_run_id'), 'findings', ['analysis_run_id'], unique=False)
        op.create_index(op.f('ix_findings_rule_id'), 'findings', ['rule_id'], unique=False)
        op.create_index(op.f('ix_findings_category'), 'findings', ['category'], unique=False)
        op.create_index(op.f('ix_findings_severity'), 'findings', ['severity'], unique=False)
        op.create_index(op.f('ix_findings_file_path'), 'findings', ['file_path'], unique=False)
        op.create_index(op.f('ix_findings_fingerprint'), 'findings', ['fingerprint'], unique=False)

    # 4. Create or update vulnerabilities table
    if 'vulnerabilities' not in tables:
        op.create_table(
            'vulnerabilities',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('finding_id', sa.Integer(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='OPEN'),
            sa.Column('resolution', sa.String(length=50), nullable=True),
            sa.Column('resolution_source', sa.String(length=50), nullable=True, server_default='Manual'),
            sa.Column('resolution_note', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('resolved_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['finding_id'], ['findings.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('finding_id')
        )
        op.create_index(op.f('ix_vulnerabilities_id'), 'vulnerabilities', ['id'], unique=False)
        op.create_index(op.f('ix_vulnerabilities_status'), 'vulnerabilities', ['status'], unique=False)
    else:
        columns_vuln = [c['name'] for c in inspector.get_columns('vulnerabilities')]
        if 'resolution_source' not in columns_vuln:
            op.add_column('vulnerabilities', sa.Column('resolution_source', sa.String(length=50), nullable=True, server_default='Manual'))

    # 5. Create vulnerability_history table if not exists
    if 'vulnerability_history' not in tables:
        op.create_table(
            'vulnerability_history',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('vulnerability_id', sa.Integer(), nullable=False),
            sa.Column('old_status', sa.String(length=20), nullable=False),
            sa.Column('new_status', sa.String(length=20), nullable=False),
            sa.Column('note', sa.Text(), nullable=True),
            sa.Column('changed_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['vulnerability_id'], ['vulnerabilities.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_vulnerability_history_id'), 'vulnerability_history', ['id'], unique=False)


def downgrade() -> None:
    pass
