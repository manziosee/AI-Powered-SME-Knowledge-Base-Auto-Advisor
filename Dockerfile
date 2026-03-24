# ─────────────────────────────────────────────
# Stage 1: dependency builder
# ─────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libpq-dev libmagic1 curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─────────────────────────────────────────────
# Stage 2: runtime image
# ─────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Runtime system libs only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 libmagic1 curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Download spaCy model (baked into image — no runtime download)
RUN python -m spacy download en_core_web_sm

# Pre-cache SentenceTransformer model (no API cost, runs locally)
# Avoids slow first-request model download in production
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2'); \
print('SentenceTransformer model cached.')"

# Application code
COPY . .

# Create required directories
RUN mkdir -p /app/uploads /app/models /app/logs

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser \
    && chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
