# LudiKids Platform

Plataforma de gestão para creches/escolas infantis, com foco operacional e financeiro.

## 1) Visão geral

O projeto é um monorepo com:

- **API**: NestJS + Prisma + PostgreSQL + Redis
- **Web**: Next.js (App Router) + PWA
- **Infra**: Docker Compose (dev e full stack com Caddy)

Principais módulos de negócio:

- Financeiro (faturas, pagamentos, inadimplência, despesas)
- Cadastros (crianças, responsáveis, turmas, serviços, contratos)
- Operação diária (diário de turma, inbox de coordenação)
- RH (funcionários, escalas e ponto)
- Alertas, auditoria e backups

---

## 2) Arquitetura rápida

```text
Browser (Next.js)
   ↓ HTTP
Caddy (opcional em produção)
   ├── /      -> Web (Next.js, porta 3000)
   └── /api/* -> API (NestJS, porta 4000)

API -> PostgreSQL (dados)
API -> Redis (fila/cache/jobs)
```

### Estrutura do repositório

```text
apps/
  api/                 # Backend NestJS + Prisma
  web/                 # Frontend Next.js
infra/
  docker-compose.yml        # Postgres + Redis (base)
  docker-compose.full.yml   # Stack completa (db + redis + api + web + caddy)
  Caddyfile
scripts/
  deploy-vps.sh
  seed.sh
packages/
  shared/
```

---

## 3) Pré-requisitos

- Node.js **22+**
- pnpm **9+**
- Docker + Docker Compose

---

## 4) Configuração de ambiente

Crie `.env` na raiz com base no `.env.example`:

```bash
cp .env.example .env
```

Variáveis essenciais:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `WEB_ORIGIN`
- `NEXT_PUBLIC_API_URL` (ou `API_URL` para runtime em container)

Usuários de seed (desenvolvimento):

- **Admin**: `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- **Usuário teste**: `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`
- Para desabilitar usuário de teste no seed: `CREATE_TEST_USER=false`

> ⚠️ Em produção, troque todas as credenciais padrão.

---

## 5) Como rodar

## 5.1 Desenvolvimento local rápido

```bash
chmod +x run-local.sh
./run-local.sh
```

Esse script sobe Postgres/Redis, aplica migrações, executa seed e inicia API/Web.

Acessos padrão:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`

---

## 5.2 Stack completa com Docker (recomendado para homologação)

```bash
docker compose --env-file .env -f infra/docker-compose.full.yml up -d --build
```

Comandos úteis:

```bash
docker compose --env-file .env -f infra/docker-compose.full.yml ps
docker compose --env-file .env -f infra/docker-compose.full.yml logs -f api
docker compose --env-file .env -f infra/docker-compose.full.yml logs -f web
docker compose --env-file .env -f infra/docker-compose.full.yml down
```

Healthcheck API:

```bash
curl -fsS http://localhost:4000/health
```

---

## 5.3 Produção com domínio + HTTPS (Caddy)

Defina no `.env`:

- `APP_DOMAIN` (ex.: `ludikids.com.br`)
- `CADDY_EMAIL`
- `WEB_ORIGIN=https://SEU_DOMINIO`
- `NEXT_PUBLIC_API_URL=https://api.SEU_DOMINIO`

Suba a stack:

```bash
docker compose --env-file .env -f infra/docker-compose.full.yml up -d --build
```

---

## 6) Banco de dados

Migrações:

```bash
pnpm db:migrate:deploy
```

Seed:

```bash
pnpm db:seed
```

Prisma Studio:

```bash
pnpm db:studio
```

---

## 7) Qualidade de código

Build:

```bash
pnpm build
```

Testes:

```bash
pnpm test
```

Lint:

```bash
pnpm lint
```

> Observação: o lint da API precisa de configuração completa do ESLint no workspace.

---

## 8) Backups

Backups são gerados via job e armazenados em `/backups` (ou volume `backups_data` no Docker).

Restauração com `pg_restore`:

```bash
pg_restore -h localhost -p 5432 -U ludikids -d ludikids -c --if-exists arquivo.dump
```

---

## 9) Troubleshooting rápido

### "Failed to fetch" no frontend

1. Verifique `NEXT_PUBLIC_API_URL`/`API_URL`
2. Verifique `WEB_ORIGIN` no backend
3. Verifique portas e firewall

### API não sobe após mudanças

```bash
pnpm --filter api exec prisma generate
pnpm --filter api build
```

### Ver estado da stack

```bash
docker compose --env-file .env -f infra/docker-compose.full.yml ps
```

---

## 10) Próximos passos recomendados

- Consolidar suite de testes (API e Web)
- Padronizar lint/format (ESLint + Prettier com CI)
- Fortalecer gestão de segredos e rotação de credenciais
- Adicionar pipeline de CI/CD com quality gates
