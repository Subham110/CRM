# ==============================================================
# Multi-stage production Dockerfile for FastAPI Microservice
# Optimized with Astral uv for rapid, secure, reproducible builds
# ==============================================================

FROM ghcr.io/astral-sh/uv:0.6.14-python3.12-bookworm-slim AS builder
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Copy dependency definition files first for optimal layer caching
COPY pyproject.toml uv.lock ./

# Install production dependencies without project files
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

# Copy application source code
# Copy application source code (local .venv is excluded via .dockerignore)
COPY . /app

# Install the project itself
# Install project package
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev


# Final production runtime stage
FROM python:3.12-slim-bookworm AS runner
# Final production runtime stage (Python 3.13 slim matching uv builder)
FROM python:3.13-slim-bookworm AS runner

WORKDIR /app

# Create a non-root security user
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app appuser

# Copy virtual environment and app code from builder
COPY --from=builder /app /app
# Copy virtual environment and app code from builder with proper permissions
COPY --from=builder --chown=appuser:appgroup /app /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    PORT=8000

# Fix permissions
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers"]

