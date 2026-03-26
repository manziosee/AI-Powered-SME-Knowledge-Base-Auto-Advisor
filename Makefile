# =============================================================================
# AdvisorAI — Developer Makefile
# Works on Linux, macOS, and Windows (Git Bash / WSL).
#
# Quick start:
#   make dev        — start full local stack with hot-reload
#   make prod       — start production Docker stack
#   make test       — run tests
#   make migrate    — run Alembic DB migrations
#   make deploy     — deploy to Fly.io
# =============================================================================

DC      = docker compose
DC_PROD = docker compose -f docker-compose.prod.yml
APP     = advisorai-backend

# ── Local dev (hot-reload, MinIO, Flower) ────────────────────────────────────

.PHONY: dev
dev: .env
	$(DC) up --build

.PHONY: dev-bg
dev-bg: .env
	$(DC) up --build -d

.PHONY: stop
stop:
	$(DC) down

.PHONY: clean
clean:
	$(DC) down -v --remove-orphans
	@echo "All containers and volumes removed."

.PHONY: logs
logs:
	$(DC) logs -f backend

.PHONY: shell
shell:
	$(DC) exec backend bash

.PHONY: docker-rebuild
docker-rebuild:
	$(DC) down
	$(DC) build --no-cache
	$(DC) up -d

.PHONY: docker-health
docker-health:
	./docker-health-check.sh

# ── Production (self-hosted) ──────────────────────────────────────────────────

.PHONY: prod
prod: .env
	$(DC_PROD) up --build -d

.PHONY: prod-stop
prod-stop:
	$(DC_PROD) down

.PHONY: docker-prod
docker-prod: prod

# ── Database migrations ───────────────────────────────────────────────────────

.PHONY: migrate
migrate:
	alembic upgrade head

.PHONY: migration
migration:
	alembic revision --autogenerate -m "$(msg)"

.PHONY: migrate-docker
migrate-docker:
	$(DC) run --rm migrate

# ── Local run without Docker ──────────────────────────────────────────────────

.PHONY: install
install:
	pip install -r requirements.txt
	pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl

.PHONY: run-dev
run-dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

.PHONY: run-worker
run-worker:
	celery -A app.core.celery_app worker --loglevel=info

.PHONY: run-beat
run-beat:
	celery -A app.core.celery_app beat --loglevel=info

.PHONY: run-flower
run-flower:
	celery -A app.core.celery_app flower --port=5555

# ── Tests ─────────────────────────────────────────────────────────────────────

.PHONY: test
test:
	pytest --tb=short -q

.PHONY: test-cov
test-cov:
	pytest --tb=short -q --cov=app --cov-report=term-missing

# ── Code quality ──────────────────────────────────────────────────────────────

.PHONY: format
format:
	black app/ tests/
	isort app/ tests/

.PHONY: lint
lint:
	ruff check app/ tests/

.PHONY: clean-pyc
clean-pyc:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# ── .env setup ────────────────────────────────────────────────────────────────

.env:
	@cp .env.example .env
	@echo "Created .env from .env.example — fill in your values before starting."

# ── Fly.io deployment ─────────────────────────────────────────────────────────

.PHONY: fly-setup
fly-setup:
	bash scripts/fly-setup.sh

.PHONY: deploy
deploy:
	bash scripts/fly-deploy.sh

.PHONY: fly-logs
fly-logs:
	flyctl logs -a $(APP)

.PHONY: fly-ssh
fly-ssh:
	flyctl ssh console -a $(APP)

.PHONY: fly-status
fly-status:
	flyctl status -a $(APP)

.PHONY: fly-secrets
fly-secrets:
	flyctl secrets list -a $(APP)
