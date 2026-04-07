# =============================================================================
# AdvisorAI Backend — optimised for fast rebuilds
#
# Layer order (most stable → least stable):
#   1. System packages  — cached until base image changes
#   2. pip install      — cached until requirements.txt changes
#   3. spaCy model      — cached until spaCy version changes
#   4. SentenceTransformer model — cached until model name changes
#   5. App code         — rebuilds only when YOUR code changes (seconds)
# =============================================================================

# ── Stage 1: dependency builder ───────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# System build deps — cached as long as this list doesn't change
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev libmagic1 curl \
    && rm -rf /var/lib/apt/lists/*

# Copy ONLY requirements first — pip layer is cached until requirements.txt changes
COPY requirements.txt .
# Install torch CPU from PyTorch index first, then install remaining requirements
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch \
 && pip install --no-cache-dir --prefix=/install --no-deps -r requirements.txt \
 && pip install --no-cache-dir --prefix=/install \
     fastapi uvicorn[standard] pydantic pydantic-settings \
     sqlalchemy alembic psycopg2-binary asyncpg pgvector \
     "python-jose[cryptography]" "passlib[bcrypt]" python-multipart bcrypt \
     redis celery flower \
     groq langchain langchain-text-splitters langchain-groq \
     sentence-transformers \
     spacy rank-bm25 "python-dateutil" tiktoken \
     scikit-learn joblib numpy pandas \
     pypdf pytesseract Pillow pdf2image python-docx openpyxl python-magic aiofiles \
     boto3 botocore \
     reportlab \
     httpx \
     email-validator \
     python-dotenv python-slugify \
     python-json-logger \
     pytest pytest-asyncio pytest-cov faker

# ── Stage 2: runtime image ────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Runtime system libs — tesseract + poppler for OCR/PDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 libmagic1 curl \
    tesseract-ocr tesseract-ocr-eng \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# spaCy model — separate layer, cached until spaCy version changes
RUN pip install --no-cache-dir \
    https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl

# Pre-cache SentenceTransformer model — separate layer, cached until model name changes
ENV SENTENCE_TRANSFORMERS_HOME=/app/models \
    HF_HOME=/app/models
RUN mkdir -p /app/models /app/uploads /app/logs \
 && python -c "\
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2'); \
print('Model cached.')"

# Non-root user
RUN addgroup --system appgroup \
 && adduser --system --ingroup appgroup appuser \
 && chown -R appuser:appgroup /app

# App code — LAST layer, only this rebuilds when you change code
COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
