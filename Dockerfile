FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-builder /app/frontend/dist ./dist

RUN if [ ! -f .env ]; then cp .env.example .env; fi \
    && sed -i 's/HOST=.*/HOST=0.0.0.0/g' .env \
    && sed -i 's/PORT=.*/PORT=8000/g' .env \
    && sed -i 's/DATABASE_URL=.*/DATABASE_URL=sqlite+aiosqlite:\/\/\/zshop_dev.db/g' .env

EXPOSE 8000

CMD alembic upgrade head && python scripts/seed.py && zc run