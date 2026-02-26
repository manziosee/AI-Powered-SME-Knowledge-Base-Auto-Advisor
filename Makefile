.PHONY: install run-dev run-worker run-beat migrate test clean docker-up docker-down docker-health

install:
	pip install -r requirements.txt
	python -m spacy download en_core_web_sm

run-dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run-worker:
	celery -A app.core.celery_app worker --loglevel=info

run-beat:
	celery -A app.core.celery_app beat --loglevel=info

run-flower:
	celery -A app.core.celery_app flower --port=5555

migrate:
	alembic upgrade head

migration:
	alembic revision --autogenerate -m "$(msg)"

test:
	pytest tests/ -v --cov=app

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-health:
	./docker-health-check.sh

docker-rebuild:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

docker-prod:
	docker-compose -f docker-compose.prod.yml up -d

format:
	black app/ tests/
	isort app/ tests/
