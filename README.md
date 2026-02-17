# LudiKids — Sistema de Gestão de Creche

Sistema completo para gestão de creche (uma unidade no MVP), com **PWA (Next.js)**, **API (NestJS)**, **PostgreSQL**, **Prisma** e **Redis**, preparado para desenvolvimento local e deploy em VPS (Ubuntu). Tudo em **PT-BR**.

---

## Visão geral

O LudiKids atende uma creche com ~27 crianças e ~6 funcionários. O sistema cobre:

- **Financeiro**: recebimentos, gastos, mensalidades variáveis por serviço/turma, vencimento configurável, descontos (pontualidade, irmãos), multa/juros, relatórios e alertas.
- **Cobrança por WhatsApp**: motor de régua (D-2, D0, D+10, atraso) com templates e outbox (MVP com envio stub).
- **Operação**: painel diário do professor (checklist por criança), inbox da coordenação para revisão/aprovação.
- **Cadastro**: crianças, responsáveis, endereços, autorizados a buscar, documentos, contratos (gerador de PDF no roadmap).
- **RH**: ponto digital com geolocalização/geofence, escalas, banco de horas, relatórios (admin/moderador).
- **Governança**: auditoria, backup diário, alertas.

---

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Financeiro** | Competência mensal, faturas por contrato/serviço, pagamentos, descontos, multa/juros, gastos por categoria, relatórios e termômetro de alertas. |
| **Operação** | Painel diário por turma (banho, alimentação, sono, lanche, observações, ocorrências). |
| **Coordenação** | Inbox para aprovar/rejeitar registros e marcar “contatado responsável”. |
| **RH** | Cadastro de funcionários, escalas, ponto com geolocalização (geofence), relatórios de atrasos/faltas e banco de horas. |
| **Documentos/Contratos** | Cadastro de documentos (upload no roadmap). Contratos com múltiplos serviços; gerador de PDF (HTML→PDF) no roadmap. |
| **WhatsApp** | Templates, regras por vencimento (D-2, D0, D+10, atraso), outbox; MVP com “enviar” em stub (arquitetura pronta para provedor real). |
| **Governança** | Auditoria em ações sensíveis, backup diário (pg_dump em volume), alertas (inadimplência, gastos, RH). |

---

## Perfis e permissões (RBAC)

| Perfil | Acesso |
|--------|--------|
| **MODERADOR** | Total: configurações, relatórios sensíveis (ex.: ranking RH), auditoria. |
| **ADMINISTRADOR** | Financeiro, cadastros, relatórios. |
| **COORDENAÇÃO** | Revisar/aprovar itens do painel diário, marcar contatado. |
| **PROFESSOR** | Painel diário da turma e registros do dia (limitado). |

---

## Arquitetura

- **Monorepo (pnpm workspace)**  
  - `apps/api` — NestJS (API REST).  
  - `apps/web` — Next.js (PWA).  
  - `packages/shared` — Tipos e constantes compartilhados.  
- **Infra**  
  - `infra/docker-compose.yml` — Postgres, Redis, API, Web.  
- **Banco**  
  - PostgreSQL + Prisma (schema em `apps/api/prisma/schema.prisma`).  
- **Filas/Jobs**  
  - Redis (BullMQ preparado); jobs agendados com `@nestjs/schedule` (cron): WhatsApp diário, alertas, backup.  
- **Multi-tenant**  
  - Modelo preparado (tenant por unidade); MVP com um tenant default “LudiKids”.

---

## Como rodar localmente

### Pré-requisitos

- Node 22+  
- pnpm 9+  
- Docker e Docker Compose (para Postgres e Redis)

### 1. Clonar e instalar

```bash
cd ludikids_software
pnpm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env
# Ajuste DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD se quiser.
```

### 3. Subir Postgres e Redis

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

### 4. Migrations e seed

```bash
pnpm db:migrate
pnpm db:seed
```

(Se já existir a migration aplicada, use `pnpm --filter api exec prisma migrate deploy` e depois `pnpm db:seed`.)

### 5. Rodar API e Web

```bash
pnpm dev
```

- **API**: http://localhost:4000  
- **Swagger**: http://localhost:4000/docs  
- **Web (PWA)**: http://localhost:3000  

### 6. Login

- E-mail: valor de `ADMIN_EMAIL` (ex.: `admin@ludikids.com.br`)  
- Senha: valor de `ADMIN_PASSWORD` (ex.: `Admin@123`)  
- Perfil: MODERADOR (seed).

---

## Deploy em VPS (Ubuntu) — alto nível

1. **Servidor**: Ubuntu 22.04+, Docker e Docker Compose instalados.  
2. **Repositório**: clonar o projeto na VPS.  
3. **Env**: criar `.env` a partir de `.env.example` com valores de produção (DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_API_URL, etc.).  
4. **Build e run**:
   ```bash
   docker compose -f infra/docker-compose.yml up -d --build
   ```
5. **Migrations** (uma vez ou após deploy):
   ```bash
   docker compose -f infra/docker-compose.yml run --rm api pnpm exec prisma migrate deploy
   docker compose -f infra/docker-compose.yml run --rm api pnpm exec prisma db seed
   ```
6. **Nginx** (recomendado na VPS):  
   - Proxy reverso para a API (ex.: `api.seudominio.com.br` → `localhost:4000`) e para o Web (ex.: `app.seudominio.com.br` → `localhost:3000`).  
   - SSL com Let’s Encrypt (certbot).  
   - Definir `WEB_ORIGIN` e `NEXT_PUBLIC_API_URL` conforme os domínios usados.

---

## Rotinas e jobs

| Job | Horário (cron) | Descrição |
|-----|----------------|-----------|
| **WhatsApp (regras)** | 06:00 diário | Processa regras e popula a outbox (idempotente). |
| **Alertas** | 07:00 diário | Gera alertas (inadimplência, variação de gastos, RH). |
| **Backup** | 02:00 diário | Executa `pg_dump` e registra em `backup_runs`; arquivo em `/backups` (volume no container). |

Geração de faturas do mês é sob demanda (endpoint `POST /billing/generate`).

---

## Segurança e LGPD

- **Autenticação**: JWT + refresh token; senhas com Argon2.  
- **RBAC**: perfis MODERADOR, ADMINISTRADOR, COORDENAÇÃO, PROFESSOR.  
- **Auditoria**: ações críticas (contratos, faturamento, pagamentos, gastos, regras) registradas em `audit_log`.  
- **Geolocalização**: usada apenas no momento do registro de ponto (não rastreamento contínuo); validação por geofence (raio configurável no tenant).  
- **Retenção e dados**: backup diário; políticas de retenção e LGPD devem ser definidas pelo responsável legal (documentação no roadmap).

---

## Variáveis de ambiente principais

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL. |
| `REDIS_URL` | URL do Redis. |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Segredos para tokens. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciais do usuário moderador criado no seed. |
| `BACKUP_DIR` | Pasta dos dumps (no container: `/backups`). |
| `NEXT_PUBLIC_API_URL` | URL da API usada pelo frontend (ex.: em produção, o domínio da API). |
| `WEB_ORIGIN` | Origem permitida em CORS na API. |

---

## Roadmap

- Integração com gateway de pagamento (Asaas, Efí, Mercado Pago).  
- Provedor real de WhatsApp (API oficial ou parceiro).  
- Assinatura eletrônica em contratos.  
- Armazenamento de arquivos em S3 (documentos, anexos de gastos).  
- Geração de contratos em PDF (HTML→PDF) a partir de templates.  
- Nginx e SSL documentados passo a passo para VPS.

---

## Estrutura do repositório

```
ludikids_software/
├── apps/
│   ├── api/          # NestJS (Prisma, módulos de negócio, jobs)
│   └── web/          # Next.js PWA
├── packages/
│   └── shared/       # Tipos e constantes
├── infra/
│   └── docker-compose.yml
├── .env.example
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Sobe API e Web em paralelo (dev). |
| `pnpm dev:api` | Só API. |
| `pnpm dev:web` | Só Web. |
| `pnpm db:migrate` | Roda migrations (dev). |
| `pnpm db:seed` | Roda seed (tenant, roles, admin). |
| `pnpm db:studio` | Abre Prisma Studio. |
| `pnpm lint` | Lint em todos os pacotes. |
| `pnpm test` | Testes (mínimo). |

---

## Mensagens de commit sugeridas (não executadas)

- `feat: monorepo pnpm + shared types`  
- `feat(api): schema Prisma completo (tenant, users, billing, RH, WhatsApp, audit, backups)`  
- `feat(api): auth JWT + refresh, RBAC, guards e seeds`  
- `feat(api): módulos Children, Classes, Services, Contracts, Billing, Payments, Expenses`  
- `feat(api): DailyLogs, CoordinationInbox, HR (ponto/geofence), WhatsApp (templates, regras, outbox stub)`  
- `feat(api): Alerts, Backups (pg_dump + cron), Dashboard summary`  
- `feat(web): Next.js PWA, login, dashboard e páginas (crianças, contratos, financeiro, diário, coordenação, RH, WhatsApp)`  
- `chore: Docker Compose (postgres, redis, api, web) e .env.example`  
- `docs: README completo (módulos, arquitetura, rodar local, VPS, rotinas, segurança, roadmap)`  
