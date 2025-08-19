# Stage 1: Build the Next.js frontend
FROM node:20-alpine AS frontend_builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build the production environment with nginx, Node.js, and Python
FROM python:3.11-slim-bookworm AS production_env
LABEL authors="Your Name"

# Install Node.js, nginx, and other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    nginx \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PORT=8080 \
    BACKEND_PORT=8000 \
    FRONTEND_PORT=3000 \
    STORE_DIR=/app/store \
    STORE_TTL_SECONDS=0 \
    STORE_SWEEP_INTERVAL_SECONDS=60 \
    LLM_PROVIDER=gemini \
    GEMINI_MODEL=gemini-2.5-flash \
    TTS_PROVIDER=azure \
    ADOBE_EMBED_API_KEY="" \
    GOOGLE_APPLICATION_CREDENTIALS="" \
    AZURE_TTS_KEY="" \
    AZURE_TTS_ENDPOINT="" \
    OLLAMA_MODEL=""

RUN mkdir -p /app/backend /app/store /app/frontend /credentials /var/log/supervisor

COPY backend/requirements.txt /app/backend/
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Copy frontend build artifacts and dependencies
COPY --from=frontend_builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend_builder /app/frontend/public /app/frontend/public
COPY --from=frontend_builder /app/frontend/package.json /app/frontend/
COPY --from=frontend_builder /app/frontend/node_modules /app/frontend/node_modules


# Copy configuration files
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Remove default nginx config and setup custom config
RUN rm -f /etc/nginx/sites-enabled/default && \
    ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Update backend to run on port 8000
RUN sed -i 's/PORT=8080/BACKEND_PORT=8000/' /app/backend/start.py

WORKDIR /app

# Start supervisor which will manage nginx, frontend, and backend
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]