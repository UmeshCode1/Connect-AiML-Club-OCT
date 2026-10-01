# ==============================================================================
# AIML CLUB OCT — CONNECT BACKEND API
# Production Dockerfile for Azure Container Apps / OCI Container
# ==============================================================================

# Stage 1: Build dependencies
FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY apps/api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Minimal runtime image
FROM python:3.12-slim AS runner

WORKDIR /app

# Security: Non-root execution
RUN groupadd -g 10001 appuser && \
    useradd -u 10001 -g appuser -d /home/appuser -m -s /bin/bash appuser

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy API application source
COPY apps/api/src ./apps/api/src
COPY apps/api/pyproject.toml ./apps/api/

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    ENVIRONMENT=production

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python3 -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ.get('PORT', '8000') + '/health')" || exit 1

# Production ASGI server using Uvicorn
CMD ["uvicorn", "apps.api.src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
