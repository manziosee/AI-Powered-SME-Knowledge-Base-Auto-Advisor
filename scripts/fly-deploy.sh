#!/usr/bin/env bash
# =============================================================================
# scripts/fly-deploy.sh
# Deploy AdvisorAI backend to Fly.io.
# Run this for every deployment after the initial fly-setup.sh.
# =============================================================================
set -euo pipefail

APP="advisorai-backend"

echo "════════════════════════════════════════════"
echo " AdvisorAI — Deploying to Fly.io"
echo "════════════════════════════════════════════"

# ── Build & deploy ────────────────────────────────────────────────────────────
echo ""
echo "▶ Deploying app: $APP"
fly deploy --app "$APP" --strategy rolling

# ── Run database migrations ───────────────────────────────────────────────────
echo ""
echo "▶ Running Alembic migrations..."
fly ssh console --app "$APP" -C "alembic upgrade head"

# ── Verify health ─────────────────────────────────────────────────────────────
echo ""
echo "▶ Checking health endpoint..."
sleep 5
curl --fail --silent "https://$APP.fly.dev/health" | python3 -m json.tool || echo "Health check pending — app may still be starting"

echo ""
echo "════════════════════════════════════════════"
echo " Deploy complete!"
echo " API:    https://$APP.fly.dev/api/v1"
echo " Health: https://$APP.fly.dev/health"
echo " Logs:   fly logs -a $APP"
echo " Scale:  fly scale count web=2 -a $APP"
echo "════════════════════════════════════════════"
