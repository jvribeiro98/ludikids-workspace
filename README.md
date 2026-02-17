# LudiKids — Gestão de Creche

Sistema para gestão de creche: **API (NestJS)**, **Web PWA (Next.js)**, **PostgreSQL**, **Prisma**, **Redis**. Pensado para rodar em **VM Ubuntu 22.04**. Interface e textos em **PT-BR**.

---

## O que o sistema faz

- **Financeiro:** mensalidades por serviço/turma, vencimento configurável, descontos (pontualidade, irmãos), pagamentos, gastos, relatórios e alertas.
- **Operação:** painel diário por turma (checklist por criança), inbox da coordenação para aprovar/rejeitar.
- **Cadastro:** crianças, responsáveis, turmas, serviços, contratos.
- **RH:** funcionários, escalas, ponto com geolocalização (geofence).
- **WhatsApp (MVP):** templates, regras por vencimento, fila de envio (stub).
- **Governança:** auditoria, backup diário, alertas.

**Perfis:** MODERADOR (acesso total), ADMINISTRADOR, COORDENAÇÃO, PROFESSOR.

---

## Rodar na VM Ubuntu 22.04

### Pré-requisitos

Instale na VM:

- **Node 22:** `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -` e `sudo apt install -y nodejs`
- **pnpm:** `sudo corepack enable && sudo corepack prepare pnpm@latest --activate`
- **Docker:** [Instalação oficial Docker Engine](https://docs.docker.com/engine/install/ubuntu/) e `sudo usermod -aG docker $USER` (depois faça logout/login).

### Executar o sistema

Na pasta do projeto:

```bash
cd ludikids_software
cp .env.example .env
chmod +x run-local.sh
./run-local.sh
```

O script sobe Postgres e Redis (Docker), aplica migrations, roda o seed e inicia API e Web. Na primeira vez ele pede `pnpm install` se faltar `node_modules`.

- **Web:** http://localhost:3000 (ou http://IP_DA_VM:3000)
- **API / Swagger:** http://localhost:4000/docs
- **Login:** `admin@ludikids.com.br` / `Admin@123`

Para parar: `Ctrl+C`. Para subir de novo (banco já existe): `./run-local.sh` ou só `pnpm dev`.

### Firewall (acessar por IP)

Se precisar acessar de outro PC:

```bash
sudo ufw allow 3000
sudo ufw allow 4000
sudo ufw enable
```

---

## Estrutura

```
ludikids_software/
├── apps/
│   ├── api/        # NestJS (Prisma, auth, módulos)
│   └── web/        # Next.js PWA
├── packages/shared/
├── infra/
│   └── docker-compose.yml   # Postgres e Redis
├── .env.example
├── run-local.sh
└── package.json
```

---

## Variáveis de ambiente (.env)

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Conexão Postgres (localhost na VM). |
| `REDIS_URL` | Conexão Redis. |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Tokens de autenticação. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Usuário criado no seed. |
| `NEXT_PUBLIC_API_URL` | URL da API no navegador (na VM use `http://localhost:4000` ou `http://IP:4000`). |

---

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Sobe API e Web. |
| `pnpm dev:api` | Só API. |
| `pnpm dev:web` | Só Web. |
| `pnpm db:seed` | Recria usuário admin (seed). |
| `pnpm db:studio` | Abre Prisma Studio no banco. |
| `docker compose -f infra/docker-compose.yml ps` | Status dos containers. |
| `docker compose -f infra/docker-compose.yml down` | Parar containers. |

---

## Rotinas automáticas (na API)

- **06:00:** processamento de regras WhatsApp (outbox).
- **07:00:** geração de alertas (inadimplência, gastos, RH).
- **02:00:** backup (pg_dump) e registro em `backup_runs`.

Faturas do mês: sob demanda via endpoint `POST /billing/generate`.
