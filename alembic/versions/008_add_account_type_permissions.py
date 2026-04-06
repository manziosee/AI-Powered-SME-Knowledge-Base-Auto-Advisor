"""Add account_type and permissions columns to users; extend userrole enum.

Revision ID: 008_add_account_type_permissions
Revises: 007
Create Date: 2026-04-06
"""

from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure the userrole enum includes 'individual'
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'individual'")

    # Create accounttype enum if missing
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accounttype') THEN
                CREATE TYPE accounttype AS ENUM ('company', 'individual');
            END IF;
        END$$;
        """
    )

    # Add columns with safe IF NOT EXISTS guards
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type accounttype NOT NULL DEFAULT 'company'"
    )
    op.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT '{}'::text[]"
    )

    # Backfill any NULLs (in case column existed without defaults)
    op.execute("UPDATE users SET account_type = 'company' WHERE account_type IS NULL")
    op.execute("UPDATE users SET permissions = '{}'::text[] WHERE permissions IS NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS permissions")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS account_type")
    # Leave enums in place to avoid breaking dependent data
