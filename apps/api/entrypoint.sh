#!/bin/sh
set -e
cd /app
# Rodar migrations ao subir o container (Prisma está em dependencies)
if [ -n "$DATABASE_URL" ]; then
  npx prisma migrate deploy
fi
export NODE_ENV=production
exec node dist/main.js
