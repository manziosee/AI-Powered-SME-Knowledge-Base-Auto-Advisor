"""Add chatbot, compliance rules, integrations, and reports tables

Revision ID: 002
Revises: 001
Create Date: 2026-03-24 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # chat_sessions
    # ------------------------------------------------------------------
    op.create_table(
        "chat_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "company_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_chat_sessions_user_id", "chat_sessions", ["user_id"])
    op.create_index("ix_chat_sessions_company_id", "chat_sessions", ["company_id"])

    # ------------------------------------------------------------------
    # chat_messages
    # ------------------------------------------------------------------
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "role",
            sa.Enum("user", "assistant", "system", name="messagerole"),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sources", sa.Text(), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_chat_messages_session_id", "chat_messages", ["session_id"])

    # ------------------------------------------------------------------
    # compliance_rules
    # ------------------------------------------------------------------
    op.create_table(
        "compliance_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("country_code", sa.String(10), nullable=False),
        sa.Column("language_code", sa.String(10), default="en"),
        sa.Column(
            "category",
            sa.Enum(
                "tax", "labor", "environmental", "financial",
                "data_privacy", "health_safety", "corporate", "other",
                name="rulecategory",
            ),
            nullable=False,
        ),
        sa.Column(
            "severity",
            sa.Enum("info", "warning", "critical", name="ruleseverity"),
            default="warning",
        ),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("legal_reference", sa.String(), nullable=True),
        sa.Column("deadline_pattern", sa.String(), nullable=True),
        sa.Column("affected_industries", postgresql.JSON(), default=[]),
        sa.Column("keywords", postgresql.JSON(), default=[]),
        sa.Column("action_required", sa.Text(), nullable=True),
        sa.Column("penalty_description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_compliance_rules_country_code", "compliance_rules", ["country_code"])
    op.create_index("ix_compliance_rules_category", "compliance_rules", ["category"])

    # ------------------------------------------------------------------
    # integrations
    # ------------------------------------------------------------------
    op.create_table(
        "integrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "company_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column(
            "integration_type",
            sa.Enum(
                "webhook", "accounting", "hr_system", "erp", "crm", "custom",
                name="integrationtype",
            ),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("active", "inactive", "error", "pending", name="integrationstatus"),
            default="pending",
        ),
        sa.Column("endpoint_url", sa.String(), nullable=True),
        sa.Column("api_key_encrypted", sa.Text(), nullable=True),
        sa.Column("headers", postgresql.JSON(), default={}),
        sa.Column("payload_template", postgresql.JSON(), default={}),
        sa.Column("event_triggers", postgresql.JSON(), default=[]),
        sa.Column("last_triggered_at", sa.DateTime(), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), default=0),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_integrations_company_id", "integrations", ["company_id"])

    # ------------------------------------------------------------------
    # integration_logs
    # ------------------------------------------------------------------
    op.create_table(
        "integration_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "integration_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("integrations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("payload", postgresql.JSON(), default={}),
        sa.Column("response_status", sa.Integer(), nullable=True),
        sa.Column("response_body", sa.Text(), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("triggered_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_integration_logs_integration_id", "integration_logs", ["integration_id"])

    # ------------------------------------------------------------------
    # reports
    # ------------------------------------------------------------------
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "company_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("companies.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "requested_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "report_type",
            sa.Enum(
                "compliance_overview", "risk_distribution", "document_summary",
                "knowledge_audit", "full_dashboard",
                name="reporttype",
            ),
            nullable=False,
        ),
        sa.Column(
            "report_format",
            sa.Enum("pdf", "excel", "json", name="reportformat"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("pending", "generating", "ready", "failed", name="reportstatus"),
            default="pending",
        ),
        sa.Column("file_path", sa.String(), nullable=True),
        sa.Column("filters", postgresql.JSON(), default={}),
        sa.Column("row_count", sa.Integer(), nullable=True),
        sa.Column("file_size_bytes", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_reports_company_id", "reports", ["company_id"])


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("integration_logs")
    op.drop_table("integrations")
    op.drop_table("compliance_rules")
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")

    # Drop enums
    for enum_name in [
        "messagerole", "rulecategory", "ruleseverity",
        "integrationtype", "integrationstatus",
        "reporttype", "reportformat", "reportstatus",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
