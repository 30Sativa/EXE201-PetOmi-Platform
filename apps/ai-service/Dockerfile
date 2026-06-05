# ============================================================
# Stage 1: Base runtime
# ============================================================
FROM python:3.14-slim AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production \
    PORT=8000

EXPOSE 8000

RUN groupadd --system app \
    && useradd --system --gid app --home-dir /app --shell /usr/sbin/nologin app

# ============================================================
# Stage 2: Restore dependencies
# ============================================================
FROM base AS restore

RUN python -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

# Copy only dependency metadata first so this layer is cached when source changes.
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ============================================================
# Stage 3: Build validation
# ============================================================
FROM restore AS build

COPY app ./app

RUN python -m compileall app

# ============================================================
# Stage 4: Final image
# ============================================================
FROM base AS final

ENV PATH="/opt/venv/bin:$PATH"

COPY --from=restore --chown=app:app /opt/venv /opt/venv
COPY --from=build --chown=app:app /app/app ./app

USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).read()"]

ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
