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

<p>
  Built for African SMEs and beyond · Multi-tenant SaaS · 100% open-source dependencies · Runs free in development
</p>

</div>

---

## ✨ What it does

AdvisorAI turns a pile of PDFs, contracts, invoices, and HR policies into an intelligent advisor you can talk to. Instead of manually searching through documents, you ask a question and get an answer with exact citations — powered by a local embedding model (free) and Groq's Llama 3.1 70B (free tier).

```
"What are our VAT filing deadlines in Rwanda?"
→ Based on your uploaded documents, your RRA VAT return is due by the 15th of each month.
   Source: RRA_Compliance_Guide.pdf, page 3 | Risk: CRITICAL
```

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) *(only thing you need)*
- [Groq API key](https://console.groq.com) *(free — sign up in 30 seconds)*

### 1. Clone & configure

```bash
git clone https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor.git
cd AI-Powered-SME-Knowledge-Base-Auto-Advisor
cp .env.example .env
```

Edit `.env` — the **only** required change is your free Groq key:
```env
GROQ_API_KEY="gsk_your_key_from_console.groq.com"
```

### 2. Start everything

```bash
docker compose up --build
```

This starts: PostgreSQL + pgvector · Redis · MinIO (free S3) · FastAPI backend · Celery workers · Flower dashboard · Auto-runs DB migrations

### 3. Open the apps

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| 📖 API Docs (Swagger) | http://localhost:8000/api/v1/docs |
| 📖 API Docs (ReDoc) | http://localhost:8000/api/v1/redoc |
| ❤️ Health check | http://localhost:8000/health |
| 🌸 Celery Flower | http://localhost:5555 |
| 🗄️ MinIO Console | http://localhost:9001 |

---

## 💸 Free Services — No Credit Card Needed

Everything you need to run AdvisorAI in development is **free**:

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [**Groq**](https://console.groq.com) | LLM inference (Llama 3.1 70B) | 14,400 req/day — plenty for dev |
| **SentenceTransformers** | Text embeddings (384-dim) | Free forever — runs locally, no API |
| **PostgreSQL + pgvector** | Vector database | Self-hosted via Docker |
| **Redis** | Cache + task queue | Self-hosted via Docker |
| **MinIO** | S3-compatible file storage | Self-hosted via Docker |
| **spaCy** | NLP / entity extraction | Open source |
| **scikit-learn** | ML classification | Open source |
| **Gmail SMTP** | Email notifications | Free — use App Passwords |

**Optional paid upgrades** (plug in when you're ready to scale):

| Service | Replace with | Cost |
|---------|-------------|------|
| MinIO → AWS S3 | Real cloud storage | ~$0.023/GB |
| Groq → OpenAI GPT-4 | Higher accuracy | ~$0.01/1K tokens |
| Self-hosted → Managed DB | Supabase / Neon | Free tier available |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js 15 Frontend                         │
│   Landing · Dashboard · AI Advisor · Documents · Compliance · ...   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ REST API (JWT)
┌────────────────────────────▼────────────────────────────────────────┐
│                    FastAPI Backend  /api/v1                          │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │   Auth   │ │Documents │ │ Advisor  │ │Analytics │ │  Admin   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                      │
│  ┌─────────────────────┐   ┌──────────────────────────────────────┐ │
│  │   RAG Pipeline      │   │           AI Services                │ │
│  │  chunk → embed →    │   │  Groq Llama 3.1 70B (LLM)           │ │
│  │  dense+sparse →     │   │  SentenceTransformers (embeddings)   │ │
│  │  RRF fusion →       │   │  spaCy NLP + BM25 (hybrid search)    │ │
│  │  compress → answer  │   │  scikit-learn (risk scoring)         │ │
│  └─────────────────────┘   └──────────────────────────────────────┘ │
└──────────┬─────────────────────────────────┬────────────────────────┘
           │                                 │
┌──────────▼──────────┐         ┌────────────▼───────────┐
│  PostgreSQL + pgvector │      │   Redis                │
│  (vector store +    │         │   (cache + task queue) │
│   relational data)  │         └────────────────────────┘
└─────────────────────┘
           │
┌──────────▼──────────┐         ┌────────────────────────┐
│  Celery Workers     │         │   MinIO / AWS S3       │
│  (async document    │         │   (file storage)       │
│   processing)       │         └────────────────────────┘
└─────────────────────┘
```

---

## 📁 Project Structure

```
advisorai/
├── app/                        # FastAPI backend
│   ├── api/v1/endpoints/       # Route handlers
│   │   ├── auth.py             # JWT auth, register, login, reset
│   │   ├── documents.py        # Upload, classify, version-control
│   │   ├── advisor.py          # RAG query, streaming chat
│   │   ├── chatbot.py          # Multi-turn conversation
│   │   ├── analytics.py        # Dashboards, PDF/Excel export
│   │   ├── notifications.py    # Alerts + deadline reminders
│   │   ├── companies.py        # Multi-tenant management
│   │   ├── integrations.py     # Webhooks, ERP/HR connectors
│   │   └── admin.py            # Super-admin operations
│   ├── core/                   # Config, DB, Redis, security, middleware
│   ├── models/                 # SQLAlchemy ORM models (12 tables)
│   ├── schemas/                # Pydantic request/response schemas
│   ├── services/               # Business logic
│   │   ├── ai_service.py       # Groq/OpenAI LLM calls + embeddings
│   │   ├── rag_pipeline.py     # Hybrid RAG (dense + BM25 + RRF)
│   │   ├── compliance_service.py  # Rules engine + gap analysis
│   │   ├── document_processor.py  # PDF/DOCX text extraction
│   │   ├── s3_service.py       # MinIO / AWS S3 storage
│   │   └── report_service.py   # PDF + Excel report generation
│   └── tasks/                  # Celery async tasks
│       ├── document_tasks.py   # Process, classify, embed documents
│       ├── notification_tasks.py  # Scheduled deadline alerts
│       └── ai_tasks.py         # Background LLM jobs
├── alembic/versions/           # Database migrations (4 migrations)
├── frontend/                   # Next.js 15 app
│   ├── app/                    # App Router pages
│   │   ├── dashboard/          # Dashboard, advisor, documents, ...
│   │   ├── (auth)/             # Login, register
│   │   └── (landing)/          # About, contact, privacy, terms
│   ├── components/             # Reusable UI components
│   └── styles/                 # Global CSS + theme tokens
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
├── Dockerfile                  # Multi-stage build
├── requirements.txt            # Python dependencies
└── .env.example                # Configuration template
```

---

## 🔌 API Reference

Full interactive documentation at `/api/v1/docs` (Swagger UI) or `/api/v1/redoc`.

### Key endpoints

```
POST   /api/v1/auth/register          Register a new account
POST   /api/v1/auth/login             Get access + refresh tokens
POST   /api/v1/auth/refresh           Refresh access token
POST   /api/v1/auth/logout            Invalidate refresh token

POST   /api/v1/documents/upload       Upload a document (PDF, DOCX, XLSX, TXT)
GET    /api/v1/documents              List company documents (paginated)
GET    /api/v1/documents/{id}         Get document details
DELETE /api/v1/documents/{id}         Delete document

POST   /api/v1/advisor/query          RAG query → answer with sources
POST   /api/v1/advisor/stream         Streaming query (SSE)
POST   /api/v1/chatbot/message        Multi-turn conversation
GET    /api/v1/chatbot/sessions       List conversation history

GET    /api/v1/analytics/dashboard    KPI dashboard
GET    /api/v1/analytics/compliance   Compliance gap report
POST   /api/v1/analytics/export/pdf   Export report as PDF
POST   /api/v1/analytics/export/excel Export report as Excel

GET    /api/v1/notifications          List notifications
PUT    /api/v1/notifications/{id}/read  Mark as read

GET    /api/v1/companies/me           Get company profile
PUT    /api/v1/companies/me           Update company profile
GET    /api/v1/companies/members      List team members
POST   /api/v1/companies/invite       Invite a team member
```

---

## 🔐 Security

- **JWT authentication** — access tokens (30 min) + refresh tokens (7 days) with Redis blacklist
- **bcrypt password hashing** — with 12 rounds
- **Multi-tenant isolation** — every DB query is scoped to `company_id`; cross-tenant access is impossible
- **Rate limiting** — per-IP, configurable via `ENABLE_RATE_LIMITING`
- **Security headers** — HSTS, X-Frame-Options, CSP, X-Content-Type-Options
- **Request ID tracing** — `X-Request-ID` on every response for audit trail
- **Role-based access control** — `SUPER_ADMIN > ADMIN > MANAGER > EMPLOYEE`
- **Audit log** — every data mutation logged with user ID and timestamp
- **CORS** — configurable allowed origins list
- **TLS in production** — Nginx SSL termination (see `docker-compose.prod.yml`)

---

## 🌍 Compliance Jurisdictions

Built-in compliance rules are seeded automatically at startup for:

| Country | Rules include |
|---------|--------------|
| 🇷🇼 Rwanda | RRA VAT, CIT, PAYE, RSSB social security |
| 🇰🇪 Kenya | KRA VAT, NSSF, NHIF, PAYE |
| 🇳🇬 Nigeria | FIRS CIT, VAT, PENCOM, NSITF, ITF |
| 🇿🇦 South Africa | SARS VAT, PAYE, UIF, SDL |
| 🇫🇷 France | TVA, IS, charges sociales, URSSAF |
| 🇺🇸 USA | Federal/state tax, EIN, payroll |
| 🇪🇺 EU/GDPR | Data protection, consent, DPA |

Rules are managed via the admin API and can be extended for any jurisdiction.

---

## 🧑‍💻 Development Setup (without Docker)

If you prefer to run services individually:

```bash
# 1. Python environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Download NLP models
python -m spacy download en_core_web_sm

# 3. Run DB migrations
alembic upgrade head

# 4. Start the API
uvicorn app.main:app --reload --port 8000

# 5. Start Celery worker (in separate terminal)
celery -A app.core.celery_app worker --loglevel=info

# 6. Start Celery Beat scheduler (in separate terminal)
celery -A app.core.celery_app beat --loglevel=info

# 7. Start frontend (in separate terminal)
cd frontend && npm install && npm run dev
```

---

## 🧪 Tests

```bash
# Run all tests
pytest

# With coverage report
pytest --cov=app --cov-report=html

# Run only fast unit tests
pytest -m "not integration"
```

---

## 🐳 Production Deployment

```bash
# Uses Nginx, production-grade Postgres settings, no hot-reload
docker compose -f docker-compose.prod.yml up --build -d

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
```

For production, set these in your `.env`:
```env
ENVIRONMENT=production
DEBUG=False
SECRET_KEY="<64-char random hex>"
DATABASE_URL="postgresql+asyncpg://user:pass@your-db-host/sme_kb"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Ensure `pytest` passes
5. Submit a pull request to `develop`

---

## 📄 License

[MIT License](LICENSE) — free for personal and commercial use.

---

<div align="center">
  <p>
    Built with ❤️ for African SMEs ·
    <a href="https://github.com/manziosee/AI-Powered-SME-Knowledge-Base-Auto-Advisor/issues">Report a Bug</a> ·
    <a href="mailto:hello@advisorai.app">Contact</a>
  </p>
</div>
