"""Add OTP columns to users.

Revision ID: 009_add_otp_columns
Revises: 008
Create Date: 2026-04-15
"""

from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_secret VARCHAR"
    )
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_enabled BOOLEAN NOT NULL DEFAULT FALSE"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS otp_enabled")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS otp_secret")