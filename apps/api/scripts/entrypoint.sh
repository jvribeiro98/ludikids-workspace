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

if [ "${RUN_SEED_ON_START}" = "true" ]; then
  echo "Verificando se seed já foi aplicado (usuário admin ou algum usuário no tenant default)..."
  # Retorna 0 se já existe algum usuário no tenant default (slug ludikids) ou com ADMIN_EMAIL
  NEED_SEED=1
  if [ -n "$DATABASE_URL" ]; then
    HAS_USER=$(psql "$DATABASE_URL" -t -A -c "SELECT 1 FROM \"User\" u INNER JOIN \"Tenant\" t ON u.\"tenantId\" = t.id WHERE t.slug = 'ludikids' LIMIT 1;" 2>/dev/null | tr -d ' \n' || true)
    if [ "$HAS_USER" = "1" ]; then
      NEED_SEED=0
      echo "Já existe usuário no tenant default. Seed omitido."
    fi
  fi
  if [ "$NEED_SEED" = "1" ]; then
    echo "Nenhum usuário no tenant default. Rodando seed..."
    if ! (cd /app && pnpm db:seed); then
      echo "ERRO: Seed falhou. Container abortado."
      exit 1
    fi
    echo "Seed concluído com sucesso."
  fi
fi

echo "Iniciando API..."
exec node dist/main.js
