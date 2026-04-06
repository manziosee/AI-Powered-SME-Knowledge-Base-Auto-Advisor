"""add new features: 2FA, api_keys, share_links, document_comments, templates,
   subscriptions, user_sessions, e-signature fields, scheduled report fields,
   full-text search indexes, retention settings

Revision ID: 007_add_new_features
Revises: 006
Create Date: 2026-04-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # ── 1. Users: 2FA columns ────────────────────────────────────────────────
    op.execute("""
        ALTER TABLE users
            ADD COLUMN IF NOT EXISTS otp_secret VARCHAR,
            ADD COLUMN IF NOT EXISTS otp_enabled BOOLEAN DEFAULT FALSE
    """)

    # ── 2. Documents: e-signature + FTS columns ───────────────────────────────
    op.execute("""
        ALTER TABLE documents
            ADD COLUMN IF NOT EXISTS signature_status VARCHAR DEFAULT 'none',
            ADD COLUMN IF NOT EXISTS signature_provider VARCHAR,
            ADD COLUMN IF NOT EXISTS fts_vector TSVECTOR
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_documents_fts ON documents USING GIN (fts_vector)
    """)
    # Backfill FTS vector from extracted_text
    op.execute("""
        UPDATE documents
        SET fts_vector = to_tsvector('english', COALESCE(extracted_text, '') || ' ' || COALESCE(original_filename, ''))
        WHERE fts_vector IS NULL
    """)
    # Trigger to keep fts_vector in sync
    op.execute("""
        CREATE OR REPLACE FUNCTION documents_fts_update() RETURNS trigger AS $$
        BEGIN
            NEW.fts_vector := to_tsvector('english',
                COALESCE(NEW.extracted_text, '') || ' ' || COALESCE(NEW.original_filename, ''));
            RETURN NEW;
        END
        $$ LANGUAGE plpgsql
    """)
    op.execute("""
        DROP TRIGGER IF EXISTS documents_fts_trigger ON documents;
        CREATE TRIGGER documents_fts_trigger
        BEFORE INSERT OR UPDATE OF extracted_text, original_filename ON documents
        FOR EACH ROW EXECUTE FUNCTION documents_fts_update()
    """)

    # ── 3. Knowledge entries: FTS ─────────────────────────────────────────────
    op.execute("""
        ALTER TABLE knowledge_entries
            ADD COLUMN IF NOT EXISTS fts_vector TSVECTOR
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_knowledge_entries_fts ON knowledge_entries USING GIN (fts_vector)
    """)
    op.execute("""
        UPDATE knowledge_entries
        SET fts_vector = to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
        WHERE fts_vector IS NULL
    """)
    op.execute("""
        CREATE OR REPLACE FUNCTION knowledge_entries_fts_update() RETURNS trigger AS $$
        BEGIN
            NEW.fts_vector := to_tsvector('english',
                COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
            RETURN NEW;
        END
        $$ LANGUAGE plpgsql
    """)
    op.execute("""
        DROP TRIGGER IF EXISTS knowledge_entries_fts_trigger ON knowledge_entries;
        CREATE TRIGGER knowledge_entries_fts_trigger
        BEFORE INSERT OR UPDATE OF title, content ON knowledge_entries
        FOR EACH ROW EXECUTE FUNCTION knowledge_entries_fts_update()
    """)

    # ── 4. Reports: scheduled delivery columns ────────────────────────────────
    op.execute("""
        ALTER TABLE reports
            ADD COLUMN IF NOT EXISTS schedule VARCHAR,
            ADD COLUMN IF NOT EXISTS schedule_email VARCHAR,
            ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP
    """)

    # ── 5. API Keys table ─────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS api_keys (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name        VARCHAR NOT NULL,
            key_hash    VARCHAR NOT NULL UNIQUE,
            key_prefix  VARCHAR NOT NULL,
            scopes      JSONB DEFAULT '["read"]',
            is_active   BOOLEAN DEFAULT TRUE,
            last_used_at TIMESTAMP,
            expires_at  TIMESTAMP,
            created_at  TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_api_keys_user_id ON api_keys(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_api_keys_key_hash ON api_keys(key_hash)")

    # ── 6. Share links table ──────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS share_links (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            created_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token         VARCHAR NOT NULL UNIQUE,
            password_hash VARCHAR,
            expires_at    TIMESTAMP,
            max_views     INTEGER,
            view_count    INTEGER DEFAULT 0,
            is_active     BOOLEAN DEFAULT TRUE,
            created_at    TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_share_links_token ON share_links(token)")

    # ── 7. Document comments table ────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS document_comments (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
            parent_id   UUID REFERENCES document_comments(id),
            content     TEXT NOT NULL,
            is_edited   BOOLEAN DEFAULT FALSE,
            created_at  TIMESTAMP DEFAULT NOW(),
            updated_at  TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_doc_comments_document_id ON document_comments(document_id)")

    # ── 8. Templates table ────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS templates (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name          VARCHAR NOT NULL,
            description   TEXT,
            category      VARCHAR DEFAULT 'other',
            country_code  VARCHAR,
            industry      VARCHAR,
            content       TEXT NOT NULL,
            fields        JSONB DEFAULT '[]',
            tags          JSONB DEFAULT '[]',
            is_public     BOOLEAN DEFAULT TRUE,
            company_id    UUID,
            created_by    UUID,
            is_active     BOOLEAN DEFAULT TRUE,
            usage_count   INTEGER DEFAULT 0,
            created_at    TIMESTAMP DEFAULT NOW(),
            updated_at    TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_templates_category ON templates(category)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_templates_country_code ON templates(country_code)")

    # ── 9. Subscriptions table ────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id                 UUID NOT NULL UNIQUE,
            plan                       VARCHAR DEFAULT 'free',
            status                     VARCHAR DEFAULT 'active',
            billing_cycle              VARCHAR DEFAULT 'monthly',
            stripe_customer_id         VARCHAR,
            stripe_subscription_id     VARCHAR,
            stripe_price_id            VARCHAR,
            max_documents              INTEGER DEFAULT 10,
            max_users                  INTEGER DEFAULT 3,
            max_ai_queries_per_month   INTEGER DEFAULT 50,
            trial_ends_at              TIMESTAMP,
            current_period_start       TIMESTAMP,
            current_period_end         TIMESTAMP,
            canceled_at                TIMESTAMP,
            ai_queries_used            INTEGER DEFAULT 0,
            extra_meta                 JSONB DEFAULT '{}',
            created_at                 TIMESTAMP DEFAULT NOW(),
            updated_at                 TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_subscriptions_company_id ON subscriptions(company_id)")

    # ── 10. User sessions table ───────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            refresh_token_jti    VARCHAR NOT NULL UNIQUE,
            ip_address           VARCHAR,
            user_agent           VARCHAR,
            device_hint          VARCHAR,
            is_active            BOOLEAN DEFAULT TRUE,
            created_at           TIMESTAMP DEFAULT NOW(),
            last_seen_at         TIMESTAMP DEFAULT NOW(),
            expires_at           TIMESTAMP
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_sessions_user_id ON user_sessions(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_sessions_jti ON user_sessions(refresh_token_jti)")


def downgrade():
    # Reverse in reverse order
    op.execute("DROP TABLE IF EXISTS user_sessions")
    op.execute("DROP TABLE IF EXISTS subscriptions")
    op.execute("DROP TABLE IF EXISTS templates")
    op.execute("DROP TABLE IF EXISTS document_comments")
    op.execute("DROP TABLE IF EXISTS share_links")
    op.execute("DROP TABLE IF EXISTS api_keys")

    op.execute("DROP TRIGGER IF EXISTS documents_fts_trigger ON documents")
    op.execute("DROP TRIGGER IF EXISTS knowledge_entries_fts_trigger ON knowledge_entries")
    op.execute("DROP FUNCTION IF EXISTS documents_fts_update")
    op.execute("DROP FUNCTION IF EXISTS knowledge_entries_fts_update")

    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS schedule")
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS schedule_email")
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS next_run_at")
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS last_sent_at")

    op.execute("ALTER TABLE knowledge_entries DROP COLUMN IF EXISTS fts_vector")
    op.execute("ALTER TABLE documents DROP COLUMN IF EXISTS signature_status")
    op.execute("ALTER TABLE documents DROP COLUMN IF EXISTS signature_provider")
    op.execute("ALTER TABLE documents DROP COLUMN IF EXISTS fts_vector")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS otp_secret")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS otp_enabled")
