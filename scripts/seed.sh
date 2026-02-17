#!/bin/bash
# Roda prisma generate e seed com .env carregado. Execute na raiz: ./scripts/seed.sh
set -e
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then
  echo "Crie o arquivo .env (copie de .env.example)."
  exit 1
fi
set -a
source .env
set +a
pnpm --filter api exec prisma generate
pnpm db:seed
