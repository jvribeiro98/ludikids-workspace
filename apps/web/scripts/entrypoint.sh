#!/bin/sh
set -e

# API URL: prefer API_URL, fallback NEXT_PUBLIC_API_URL
API_URL="${API_URL:-${NEXT_PUBLIC_API_URL}}"
if [ -z "$API_URL" ]; then
  echo "ERRO: API_URL ou NEXT_PUBLIC_API_URL deve estar definido."
  exit 1
fi

# Validar que a URL começa com http:// ou https://
case "$API_URL" in
  http://*|https://*) ;;
  *)
    echo "ERRO: API_URL inválida (deve começar com http:// ou https://): $API_URL"
    exit 1
    ;;
esac

# Gerar runtime-config.js a partir do template
DIR="${0%/*}"
if [ -z "$DIR" ] || [ "$DIR" = "$0" ]; then
  DIR="."
fi
ROOT="$(cd "$DIR/.." && pwd)"
TEMPLATE="$ROOT/public/runtime-config.template.js"
OUT="$ROOT/public/runtime-config.js"

if [ ! -f "$TEMPLATE" ]; then
  echo "ERRO: Template não encontrado: $TEMPLATE"
  exit 1
fi

sed "s|__API_URL__|$API_URL|g" "$TEMPLATE" > "$OUT"
echo "runtime-config.js gerado com API_URL=$API_URL"

# Iniciar o servidor (standalone: node server.js; senão next start)
if [ -f "$ROOT/.next/standalone/server.js" ]; then
  cd "$ROOT/.next/standalone"
  exec node server.js
fi
cd "$ROOT"
exec pnpm start
