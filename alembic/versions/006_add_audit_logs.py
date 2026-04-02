"""add audit_logs table

Revision ID: 006_add_audit_logs
Revises: 005_add_notifications
Create Date: 2026-04-02
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '006_add_audit_logs'
down_revision = '005_add_notifications'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            action VARCHAR NOT NULL,
            resource_type VARCHAR NOT NULL,
            resource_id VARCHAR,
            details JSONB DEFAULT '{}',
            ip_address VARCHAR,
            user_agent VARCHAR,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs(created_at DESC)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS audit_logs")
