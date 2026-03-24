"""Fix embedding columns from 1536 to 384 dimensions (HuggingFace all-MiniLM-L6-v2)

Revision ID: 003
Revises: 002
Create Date: 2026-03-24 00:01:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing vector columns and recreate with correct dimension.
    # Note: pgvector does not support ALTER COLUMN for vector types,
    # so we must drop + add.
    op.drop_column("documents", "embedding")
    op.drop_column("knowledge_entries", "embedding")

    op.execute("ALTER TABLE documents ADD COLUMN embedding vector(384)")
    op.execute("ALTER TABLE knowledge_entries ADD COLUMN embedding vector(384)")

    # Recreate HNSW / IVFFlat indexes for fast similarity search
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


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_documents_embedding")
    op.execute("DROP INDEX IF EXISTS ix_knowledge_entries_embedding")

    op.drop_column("documents", "embedding")
    op.drop_column("knowledge_entries", "embedding")

    op.execute("ALTER TABLE documents ADD COLUMN embedding vector(1536)")
    op.execute("ALTER TABLE knowledge_entries ADD COLUMN embedding vector(1536)")
