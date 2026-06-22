#!/usr/bin/env bash
set -e

echo "Running database migrations..."
alembic upgrade head || echo "Alembic migration step failed (continuing; app will create tables)."

echo "Starting ChoodUndo API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers "${UVICORN_WORKERS:-1}" --proxy-headers --forwarded-allow-ips="*"
