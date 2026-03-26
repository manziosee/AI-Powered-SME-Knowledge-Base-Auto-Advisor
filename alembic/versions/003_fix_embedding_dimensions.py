"""Create core tables (documents, knowledge_entries) and fix embedding dims to 384

Revision ID: 003
Revises: 002
Create Date: 2026-03-24 00:01:00.000000

Rewritten to be idempotent.  On a fresh database it creates the tables from
scratch with correct 384-dim embedding columns.  On an existing database it
drops the old 1536-dim columns and recreates them at 384 dims.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def _table_exists(conn, table_name: str) -> bool:
    result = conn.execute(
        sa.text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name=:t)"
        ),
        {"t": table_name},
    )
    return result.scalar()


def _column_exists(conn, table_name: str, column_name: str) -> bool:
    result = conn.execute(
        sa.text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=:t AND column_name=:c)"
        ),
        {"t": table_name, "c": column_name},
    )
    return result.scalar()


def upgrade() -> None:
    conn = op.get_bind()

    # ── documents ─────────────────────────────────────────────────────────────
    if not _table_exists(conn, "documents"):
        op.create_table(
            "documents",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column(
                "company_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("companies.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("filename", sa.String(), nullable=False),
            sa.Column("original_filename", sa.String(), nullable=False),
            sa.Column("file_path", sa.String(), nullable=False),
            sa.Column("file_size", sa.Integer(), nullable=False),
            sa.Column("mime_type", sa.String(), nullable=False),
            sa.Column(
                "document_type",
                sa.Enum(
                    "contract", "invoice", "policy", "report", "tax_document",
                    "hr_document", "compliance", "other",
                    name="documenttype",
                ),
                default="other",
            ),
            sa.Column(
                "status",
                sa.Enum(
                    "uploaded", "processing", "processed", "failed",
                    name="documentstatus",
                ),
                default="uploaded",
            ),
            sa.Column("version", sa.Integer(), default=1),
            sa.Column(
                "parent_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("documents.id"),
                nullable=True,
            ),
            sa.Column("extracted_text", sa.Text(), nullable=True),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column("metadata", postgresql.JSON(), default={}),
            sa.Column("tags", postgresql.JSON(), default=[]),
            sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("created_at", sa.DateTime(), default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
            sa.Column("processed_at", sa.DateTime(), nullable=True),
        )
        op.execute("ALTER TABLE documents ADD COLUMN embedding vector(384)")
    else:
        # Table exists — fix embedding dimension if needed
        if _column_exists(conn, "documents", "embedding"):
            op.execute("ALTER TABLE documents DROP COLUMN embedding")
        op.execute("ALTER TABLE documents ADD COLUMN embedding vector(384)")

    # ── knowledge_entries ──────────────────────────────────────────────────────
    if not _table_exists(conn, "knowledge_entries"):
        op.create_table(
            "knowledge_entries",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column(
                "company_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("companies.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "document_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("documents.id", ondelete="CASCADE"),
                nullable=True,
            ),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column(
                "knowledge_type",
                sa.Enum(
                    "regulation", "policy", "deadline", "contract_clause",
                    "risk_item", "best_practice", "faq", "general",
                    name="knowledgetype",
                ),
                default="general",
            ),
            sa.Column(
                "risk_level",
                sa.Enum("low", "medium", "high", "critical", name="risklevel"),
                nullable=True,
            ),
            sa.Column("source", sa.String(), nullable=True),
            sa.Column("tags", postgresql.JSON(), default=[]),
            sa.Column("metadata", postgresql.JSON(), default={}),
            sa.Column("is_active", sa.Boolean(), default=True),
            sa.Column("deadline", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
        )
        op.execute("ALTER TABLE knowledge_entries ADD COLUMN embedding vector(384)")
    else:
        if _column_exists(conn, "knowledge_entries", "embedding"):
            op.execute("ALTER TABLE knowledge_entries DROP COLUMN embedding")
        op.execute("ALTER TABLE knowledge_entries ADD COLUMN embedding vector(384)")

    # ── Indexes ────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_documents_embedding
        ON documents USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_knowledge_entries_embedding
        ON knowledge_entries USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_documents_company_id ON documents (company_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_ke_company_id ON knowledge_entries (company_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_documents_embedding")
    op.execute("DROP INDEX IF EXISTS ix_knowledge_entries_embedding")
    op.execute("DROP INDEX IF EXISTS ix_documents_company_id")
    op.execute("DROP INDEX IF EXISTS ix_ke_company_id")
    op.drop_table("knowledge_entries")
    op.drop_table("documents")
