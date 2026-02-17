#!/bin/bash
# LudiKids — Deploy em produção na VPS (build + systemd)
# Uso: na pasta do projeto, chmod +x scripts/deploy-vps.sh && ./scripts/deploy-vps.sh
# Requer: .env configurado, Docker (Postgres/Redis), Node 22, pnpm

set -e
cd "$(dirname "$0")/.."
APP_ROOT="$(pwd)"

if [ ! -f .env ]; then
  echo "Erro: .env não encontrado. Copie de .env.example e configure (NEXT_PUBLIC_API_URL, WEB_ORIGIN, etc.)."
  exit 1
fi

echo "=== 1. Subindo Postgres e Redis (Docker) ==="
docker compose -f infra/docker-compose.yml up -d postgres redis || true
echo "Aguardando Postgres (15s)..."
sleep 15

echo "=== 2. Instalando dependências ==="
pnpm install --frozen-lockfile

echo "=== 3. Build (API + Web) ==="
pnpm --filter api exec prisma generate
pnpm build

echo "=== 4. Migrations ==="
set -a && source .env && set +a
pnpm --filter api exec prisma migrate deploy

echo "=== 5. Seed (se já rodou antes, pode ignorar falha) ==="
pnpm db:seed || true

echo "=== 6. Instalando serviços systemd ==="
SVC_DIR="infra/systemd"
for f in ludikids-api.service ludikids-web.service; do
  sed "s|__APP_ROOT__|$APP_ROOT|g" "$SVC_DIR/$f" | sudo tee "/etc/systemd/system/$f" > /dev/null
  echo "  Instalado: /etc/systemd/system/$f"
done

echo "=== 7. Ativando e iniciando serviços ==="
sudo systemctl daemon-reload
sudo systemctl enable ludikids-api.service ludikids-web.service
sudo systemctl restart ludikids-api.service ludikids-web.service

echo ""
echo "Deploy concluído. Status:"
sudo systemctl status ludikids-api.service ludikids-web.service --no-pager || true
echo ""
echo "Comandos úteis:"
echo "  sudo systemctl status ludikids-api ludikids-web"
echo "  sudo systemctl restart ludikids-api ludikids-web"
echo "  sudo journalctl -u ludikids-api -f"
echo "  sudo journalctl -u ludikids-web -f"
