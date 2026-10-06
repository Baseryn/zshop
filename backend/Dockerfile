FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=7860
EXPOSE 7860

RUN mkdir -p /app/storage

ENV DATABASE_URL="sqlite+aiosqlite:///./zshop.db"
ENV SECRET_KEY="showcase_secret_key_change_me_super_secure_991823"
ENV DEBUG="false"

CMD alembic upgrade head && python scripts/seed.py && uvicorn main:app --host 0.0.0.0 --port 7860