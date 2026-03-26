#!/usr/bin/env bash
# =============================================================================
# scripts/fly-setup.sh
# One-time Fly.io infrastructure setup for AdvisorAI backend.
# Run this ONCE before the first deploy.
#
# Prerequisites:
#   1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
#   2. Authenticate:   fly auth login
#   3. Fill in the SECRET VALUES section below before running.
# =============================================================================
set -euo pipefail

APP="advisorai-backend"
REGION="iad"           # Washington DC
PG_NAME="advisorai-db"
REDIS_NAME="advisorai-redis"

echo "════════════════════════════════════════════"
echo " AdvisorAI — Fly.io first-time setup"
echo "════════════════════════════════════════════"

# ── 1. Create the app ────────────────────────────────────────────────────────
echo ""
echo "▶ Creating app: $APP"
fly apps create "$APP" --machines || echo "  (app may already exist — continuing)"

# ── 2. Postgres with pgvector ─────────────────────────────────────────────────
echo ""
echo "▶ Creating Postgres cluster: $PG_NAME"
fly postgres create \
  --name "$PG_NAME" \
  --region "$REGION" \
  --vm-size shared-cpu-1x \
  --initial-cluster-size 1 \
  --volume-size 10

echo ""
echo "▶ Attaching Postgres to app (sets DATABASE_URL secret automatically)"
fly postgres attach "$PG_NAME" --app "$APP"

# ── 3. Redis ──────────────────────────────────────────────────────────────────
echo ""
echo "▶ Creating Redis instance: $REDIS_NAME"
fly redis create \
  --name "$REDIS_NAME" \
  --region "$REGION" \
  --plan free-6m

echo ""
echo "▶ Getting Redis URL (copy it — you need it for secrets below)"
fly redis status "$REDIS_NAME"

# ── 4. Persistent volume for uploads ─────────────────────────────────────────
echo ""
echo "▶ Creating persistent volume for /app/uploads"
fly volumes create advisorai_uploads \
  --app "$APP" \
  --region "$REGION" \
  --size 3

# ── 5. Enable pgvector extension ─────────────────────────────────────────────
echo ""
echo "▶ Enabling pgvector extension on Postgres"
echo "  Run this manually after DB is ready:"
echo "    fly postgres connect -a $PG_NAME"
echo "    Then execute: CREATE EXTENSION IF NOT EXISTS vector;"
echo ""

# ── 6. Set secrets ────────────────────────────────────────────────────────────
# FILL IN THESE VALUES before running this script.
echo ""
echo "▶ Setting app secrets..."

# Replace every <...> placeholder with your real values.
fly secrets set \
  --app "$APP" \
  SECRET_KEY="<generate-with: openssl rand -hex 32>" \
  REDIS_URL="<redis://...from fly redis status above>" \
  CELERY_BROKER_URL="<same redis url>" \
  CELERY_RESULT_BACKEND="<same redis url>/1" \
  AWS_ACCESS_KEY_ID="<your-aws-key-id>" \
  AWS_SECRET_ACCESS_KEY="<your-aws-secret>" \
  AWS_REGION="us-east-1" \
  S3_BUCKET_NAME="<your-s3-bucket>" \
  GROQ_API_KEY="<your-groq-api-key>" \
  CORS_ORIGINS="https://your-vercel-frontend.vercel.app,https://yourdomain.com" \
  SMTP_HOST="smtp.gmail.com" \
  SMTP_PORT="587" \
  SMTP_USER="<your-gmail>" \
  SMTP_PASSWORD="<gmail-app-password>" \
  EMAILS_FROM_EMAIL="<your-gmail>" \
  WEBHOOK_SECRET="<generate-with: openssl rand -hex 32>"

echo ""
echo "════════════════════════════════════════════"
echo " Setup complete!"
echo " Next steps:"
echo "   1. Run:  bash scripts/fly-deploy.sh"
echo "   2. After first deploy, run migrations:"
echo "      fly ssh console -a $APP -C 'alembic upgrade head'"
echo "   3. Verify health:"
echo "      curl https://$APP.fly.dev/health"
echo "════════════════════════════════════════════"
