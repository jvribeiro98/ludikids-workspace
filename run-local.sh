#!/bin/bash
# LudiKids - Subir na VM Ubuntu (Postgres + Redis + API + Web)
# Uso: chmod +x run-local.sh && ./run-local.sh

set -e
cd "$(dirname "$0")"

if ! command -v docker &>/dev/null; then
  echo "Erro: Docker não encontrado. Instale Docker e tente de novo."
  exit 1
fi

if ! docker info &>/dev/null; then
  echo "Erro: Docker não está rodando. Inicie o Docker e tente de novo."
  exit 1
fi

if [ ! -f .env ]; then
  echo "Arquivo .env não encontrado. Copiando de .env.example..."
  cp .env.example .env
fi

if [ ! -d node_modules ]; then
  echo "Dependências não instaladas. Rodando pnpm install..."
  pnpm install
fi

echo "1. Subindo Postgres e Redis..."
docker compose -f infra/docker-compose.yml up -d postgres redis

echo "2. Aguardando Postgres (15s)..."
sleep 15

echo "3. Aplicando migrations..."
export $(grep -E '^DATABASE_URL=' .env | xargs)
pnpm --filter api exec prisma migrate deploy

echo "4. Rodando seed (cria usuário admin)..."
pnpm db:seed

echo "5. Iniciando API (4000) e Web (3000). Ctrl+C para parar."
pnpm dev
