# Single-container build: the FastAPI backend serves the built frontend, so the
# whole game runs on one origin. Used for the Render deploy (see render.yaml).

# --- Frontend build ---
FROM node:20-slim AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Backend runtime ---
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV STATIC_DIR=/app/static

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend /frontend/dist ./static

# Render sets PORT; default to 8000 for local runs
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
