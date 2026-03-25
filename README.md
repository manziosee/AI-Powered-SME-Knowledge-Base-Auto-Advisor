<div align="center">

<h1>⚡ AdvisorAI</h1>
<h3>AI-Powered Knowledge Base & Compliance Advisor for SMEs</h3>

<p>
  <a href="https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-violet.svg" alt="MIT License" />
  </a>
  <a href="https://www.python.org/downloads/">
    <img src="https://img.shields.io/badge/Python-3.11%2B-blue?logo=python" alt="Python 3.11+" />
  </a>
  <a href="https://fastapi.tiangolo.com">
    <img src="https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi" alt="FastAPI" />
  </a>
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-15.5-black?logo=next.js" alt="Next.js" />
  </a>
  <img src="https://img.shields.io/badge/AI-Groq%20%7C%20LangChain-8B5CF6" alt="AI Stack" />
  <img src="https://img.shields.io/badge/DB-PostgreSQL%20%2B%20pgvector-336791?logo=postgresql" alt="pgvector" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker" alt="Docker" />
</p>

<p>
  <strong>Upload your business documents. Ask questions in plain English. Stay ahead of compliance — automatically.</strong>
</p>

</div>

---

## What it does

AdvisorAI turns a pile of PDFs, contracts, invoices, and HR policies into an intelligent advisor you can talk to. Instead of manually searching through documents, you ask a question and get a cited answer — powered by a local embedding model (free) and Groq Llama 3.1 70B (free tier).

```
"What are our VAT filing deadlines?"
→ Based on your uploaded documents, your VAT return is due by the 15th of each month.
   Source: Compliance_Guide.pdf, page 3 | Risk: HIGH
```

---

## Quick Start (5 minutes)

**Prerequisites:** [Docker & Docker Compose](https://docs.docker.com/get-docker/) · [Groq API key](https://console.groq.com) (free)

```bash
git clone https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor.git
cd AI-Powered-SME-Knowledge-Base-Auto-Advisor
cp .env.example .env
# Edit .env — add your free Groq key:
# GROQ_API_KEY="gsk_your_key_from_console.groq.com"

docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Docs | http://localhost:8000/api/v1/docs |
| Health check | http://localhost:8000/health |
| Celery Flower | http://localhost:5555 |
| MinIO Console | http://localhost:9001 |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Next.js 15 Frontend                    │
│  Landing · Dashboard · AI Advisor · Documents · ... │
└────────────────────┬────────────────────────────────┘
                     │ REST API (JWT)
┌────────────────────▼────────────────────────────────┐
│              FastAPI Backend  /api/v1               │
│                                                     │
│  Auth  Documents  Advisor  Analytics  Admin  ...   │
│                                                     │
│  RAG Pipeline: chunk → embed → hybrid search →     │
│  RRF fusion → contextual compression → answer      │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
┌──────────▼──────────┐  ┌────────────▼───────────┐
│ PostgreSQL+pgvector │  │   Redis (cache+queue)  │
└─────────────────────┘  └────────────────────────┘
           │
┌──────────▼──────────┐  ┌────────────────────────┐
│   Celery Workers    │  │   MinIO / AWS S3       │
│ (document + AI      │  │   (file storage)       │
│  background tasks)  │  └────────────────────────┘
└─────────────────────┘
```

---

## Security

- JWT authentication — 30-min access tokens + 7-day refresh tokens with Redis blacklist
- bcrypt password hashing (12 rounds)
- Multi-tenant isolation — every query is scoped to `company_id`
- Sliding-window rate limiting per IP (backed by Redis)
- Security headers — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- HSTS + TLS in production via Nginx
- Role-based access control — `SUPER_ADMIN > ADMIN > MANAGER > EMPLOYEE`
- Full audit log — every mutation logged with user ID and timestamp
- Account lockout after repeated failed logins
- HMAC-signed webhooks

---

## Development Setup (without Docker)

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm

alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Separate terminals:
celery -A app.core.celery_app worker --loglevel=info
celery -A app.core.celery_app beat  --loglevel=info
cd frontend && npm install && npm run dev
```

---

## Tests

```bash
pytest
pytest --cov=app --cov-report=html
```

---

## Production Deployment

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Set in `.env` for production:
```env
ENVIRONMENT=production
DEBUG=False
SECRET_KEY="<64-char random hex>"
DATABASE_URL="postgresql+asyncpg://user:pass@your-db-host/sme_kb"
```

-
