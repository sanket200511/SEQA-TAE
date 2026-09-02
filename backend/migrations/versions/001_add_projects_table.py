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

    # 2. Add columns to analysis_runs
    columns_analysis = [c['name'] for c in inspector.get_columns('analysis_runs')]
    if 'project_id' not in columns_analysis:
        op.add_column('analysis_runs', sa.Column('project_id', sa.Integer(), nullable=True))
        op.create_index(op.f('ix_analysis_runs_project_id'), 'analysis_runs', ['project_id'], unique=False)
        op.create_foreign_key('fk_analysis_runs_projects', 'analysis_runs', 'projects', ['project_id'], ['id'], ondelete='CASCADE')
    
    if 'files_analyzed' not in columns_analysis:
        op.add_column('analysis_runs', sa.Column('files_analyzed', sa.Integer(), nullable=False, server_default='0'))

    # 3. Add resolution_source to vulnerabilities
    columns_vuln = [c['name'] for c in inspector.get_columns('vulnerabilities')]
    if 'resolution_source' not in columns_vuln:
        op.add_column('vulnerabilities', sa.Column('resolution_source', sa.String(length=50), nullable=True, server_default='Manual'))


def downgrade() -> None:
    pass
