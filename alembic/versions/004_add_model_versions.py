"""Add model_versions table for ML model lifecycle tracking

Revision ID: 004
Revises: 003
Create Date: 2026-03-24 00:02:00.000000

This migration creates the model_versions table which tracks every
trained ML model artefact (document classifier, risk scorer).

Each row stores:
  - model_type  : which model this is (document_classifier | risk_scorer)
  - version     : semver string (1.0.0, 1.0.1 …)
  - status      : queued → running → completed | failed
  - is_active   : boolean flag — only one row per (model_type, company_id)
                  should be active at any time
  - accuracy / cv_accuracy : float metrics from training
  - file_path   : absolute path to the .pkl file on disk
  - company_id  : NULL = global model; UUID = per-tenant fine-tuned model
  - trained_by  : UUID of the user who triggered training (nullable)
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── model_versions table ──────────────────────────────────────────────────
    # Use String for model_type and status to avoid PostgreSQL enum conflicts
    # across migration runs.  Application-level validation enforces valid values.
    op.create_table(
        "model_versions",
        sa.Column("id",             UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),

        sa.Column("model_type",     sa.String(50),  nullable=False),
        sa.Column("version",        sa.String(20),  nullable=False),
        sa.Column("status",         sa.String(20),  server_default="queued", nullable=False),
        sa.Column("is_active",      sa.Boolean, server_default="false", nullable=False),

        # Training metadata
        sa.Column("company_id",     UUID(as_uuid=True), nullable=True),
        sa.Column("sample_count",   sa.Integer,  nullable=True),
        sa.Column("accuracy",       sa.Float,    nullable=True),
        sa.Column("cv_accuracy",    sa.Float,    nullable=True),
        sa.Column("training_stats", sa.JSON,     server_default="'{}'"),
        sa.Column("classes",        sa.JSON,     server_default="'[]'"),

        # File location
        sa.Column("file_path",      sa.String,   nullable=True),

        # Audit
        sa.Column("trained_by",     UUID(as_uuid=True), nullable=True),
        sa.Column("error_message",  sa.Text,     nullable=True),
        sa.Column("notes",          sa.Text,     nullable=True),
        sa.Column("created_at",     sa.DateTime,
                  server_default=sa.text("NOW()"), nullable=False),
        sa.Column("completed_at",   sa.DateTime, nullable=True),
    )

    # ── Indexes ───────────────────────────────────────────────────────────────
    # Fast lookup by type + company (most common query pattern)
    op.create_index(
        "ix_model_versions_type_company",
        "model_versions",
        ["model_type", "company_id"],
    )
    # Fast lookup for the currently active model
    op.create_index(
        "ix_model_versions_active",
        "model_versions",
        ["model_type", "is_active"],
        postgresql_where=sa.text("is_active = true"),
    )
    # Partial unique index: at most one active version per (type, company)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS
            uq_model_versions_one_active_global
        ON model_versions (model_type)
        WHERE is_active = true AND company_id IS NULL
    """)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS
            uq_model_versions_one_active_company
        ON model_versions (model_type, company_id)
        WHERE is_active = true AND company_id IS NOT NULL
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_model_versions_one_active_company")
    op.execute("DROP INDEX IF EXISTS uq_model_versions_one_active_global")
    op.drop_index("ix_model_versions_active",       table_name="model_versions")
    op.drop_index("ix_model_versions_type_company", table_name="model_versions")
    op.drop_table("model_versions")
    # enum types removed from this migration (now using String columns)
