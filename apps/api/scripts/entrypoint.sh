#!/bin/sh
set -e

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

echo "Aguardando Postgres em ${POSTGRES_HOST}:${POSTGRES_PORT}..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" 2>/dev/null; do
  sleep 2
done

cd /app/apps/api
echo "Rodando prisma generate..."
pnpm exec prisma generate
echo "Rodando prisma migrate deploy..."
pnpm exec prisma migrate deploy

echo "Iniciando API..."
exec node dist/main.js
