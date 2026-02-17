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

**Se aparecer "Failed to fetch" ao acessar pelo IP da VPS:** confira na ordem: (1) `.env` com `NEXT_PUBLIC_API_URL=http://IP_DA_VPS:4000` (ex.: `http://131.196.199.143:4000`); (2) firewall liberando a porta 4000 (`sudo ufw allow 4000` e `sudo ufw reload`); (3) código em dia (`git pull`) e app reiniciado (`Ctrl+C` e `./run-local.sh`).

Para parar: `Ctrl+C`. Para subir de novo (banco já existe): `./run-local.sh` ou só `pnpm dev`.

### Rodar em produção na VPS (sempre ligado)

Para deixar a aplicação rodando direto (sobe com a máquina e reinicia se cair):

1. **Configure o `.env`** na raiz do projeto (incluindo `NEXT_PUBLIC_API_URL=http://IP_DA_VPS:4000` e `WEB_ORIGIN=http://IP_DA_VPS:3000`).
2. **Rode o deploy uma vez:**
   ```bash
   chmod +x scripts/deploy-vps.sh
   ./scripts/deploy-vps.sh
   ```
   O script sobe Postgres/Redis, faz build da API e da Web, aplica migrations, seed e instala dois serviços systemd: **ludikids-api** (porta 4000) e **ludikids-web** (porta 3000). Eles ficam habilitados para iniciar no boot.

3. **Comandos dos serviços:**
   ```bash
   sudo systemctl status ludikids-api ludikids-web   # status
   sudo systemctl restart ludikids-api ludikids-web  # reiniciar
   sudo journalctl -u ludikids-api -f                 # log da API
   sudo journalctl -u ludikids-web -f                 # log da Web
   ```

**Atualizar o código na VPS:** `git pull`, depois `pnpm build` e `sudo systemctl restart ludikids-api ludikids-web`. Se houver nova migration, rode `set -a && source .env && set +a && pnpm --filter api exec prisma migrate deploy` antes de reiniciar.

### Deploy em VPS (Docker — tudo em containers)

Para subir a aplicação inteira com Docker (Postgres, Redis, API e Web):

1. **Na raiz do repositório**, crie o `.env` com as variáveis necessárias (veja tabela abaixo). Para acesso externo: `NEXT_PUBLIC_API_URL=http://IP_DA_VPS:4000` e `WEB_ORIGIN=http://IP_DA_VPS:3000`.
2. **Build e subida:**
   ```bash
   docker compose -f infra/docker-compose.full.yml up -d --build
   ```
3. **Seed:** com `RUN_SEED_ON_START=true` (padrão), o entrypoint da API roda o seed idempotente na primeira subida. Para rodar manualmente:
   ```bash
   docker compose -f infra/docker-compose.full.yml exec api sh -c "cd /app && pnpm db:seed"
   ```
4. **Logs:** `docker compose -f infra/docker-compose.full.yml logs -f api` ou `logs -f web`.
5. **Parar:** `docker compose -f infra/docker-compose.full.yml down`. Volumes (postgres_data, redis_data, backups_data) são mantidos.

Backups (pg_dump formato custom `.dump`) ficam no volume `backups_data` (montado em `/backups`). Retenção: últimos 30 arquivos por tenant (`BACKUP_RETENTION_COUNT=30`).

---

### Produção com domínio (HTTPS + Caddy)

Para rodar com domínio real (ex.: `ludikids.com.br`) e HTTPS automático (Let's Encrypt):

1. **DNS:** aponte o domínio para o IP da VPS:
   - Registro **A** para `ludikids.com.br` → IP da VPS
   - Registro **A** para `api.ludikids.com.br` → mesmo IP da VPS

2. **`.env` na raiz** (exemplo para produção):

   ```env
   APP_DOMAIN=ludikids.com.br
   CADDY_EMAIL=admin@ludikids.com.br
   WEB_ORIGIN=https://ludikids.com.br
   NEXT_PUBLIC_API_URL=https://api.ludikids.com.br
   JWT_SECRET=um-secret-jwt-muito-forte-e-aleatorio
   JWT_REFRESH_SECRET=outro-secret-refresh-muito-forte
   POSTGRES_PASSWORD=senha-segura-postgres
   RUN_SEED_ON_START=true
   ADMIN_EMAIL=admin@ludikids.com.br
   ADMIN_PASSWORD=AltereSenhaAdmin123!
   ```

3. **Build e subida** (na raiz do repo):

   ```bash
   docker compose -f infra/docker-compose.full.yml up -d --build
   ```

   O serviço **Caddy** escuta nas portas 80 e 443 e roteia:
   - `https://ludikids.com.br` → Web (3000)
   - `https://api.ludikids.com.br` → API (4000)

4. **Logs e healthcheck:**

   ```bash
   docker compose -f infra/docker-compose.full.yml logs -f api
   curl -s -o /dev/null -w "%{http_code}" https://api.ludikids.com.br/docs
   curl -s -o /dev/null -w "%{http_code}" https://ludikids.com.br
   ```

5. **Checklist pós-deploy:**
   - Trocar a senha do admin no primeiro login.
   - Confirmar que backups estão rodando (job 02:00; volume `backups_data`).
   - Testar login no navegador (CORS deve aceitar apenas `WEB_ORIGIN`).
   - Verificar certificado HTTPS no navegador.

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
│   ├── docker-compose.yml      # Postgres e Redis (dev)
│   ├── docker-compose.full.yml # Postgres + Redis + API + Web + Caddy (VPS)
│   ├── Caddyfile               # Reverse proxy HTTPS (produção)
│   └── systemd/                # ludikids-api.service, ludikids-web.service
├── scripts/
│   ├── deploy-vps.sh        # build + instala serviços systemd
│   └── seed.sh
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
| `NEXT_PUBLIC_API_URL` | URL da API no navegador (na VPS use `http://IP_DA_VPS:4000`). |
| `WEB_ORIGIN` | Origens CORS (na VPS use `http://IP_DA_VPS:3000`). Várias origens: separar por vírgula. |
| `BACKUP_DIR` | Pasta de backups (padrão `/backups`; no Docker use o volume `backups_data`). |
| `BACKUP_RETENTION_COUNT` | Quantidade de backups a manter por tenant (padrão 30). |
| `APP_DOMAIN` | Domínio principal (produção com Caddy; ex.: ludikids.com.br). |
| `CADDY_EMAIL` | E-mail para Let's Encrypt (produção). |

---

## Restaurar um backup (pg_restore)

Os backups são gerados em formato custom (`.dump`) com `pg_dump -F c`. Para restaurar:

```bash
# Com Docker (conectar no Postgres do compose)
docker compose -f infra/docker-compose.full.yml exec postgres pg_restore -U ludikids -d ludikids -c --if-exists /caminho/para/backup-tenantId-data.dump

# Ou com arquivo copiado para o host
pg_restore -h localhost -p 5432 -U ludikids -d ludikids -c --if-exists backup-xxx.dump
```

- `-c --if-exists`: remove objetos antes de recriar (cuidado em produção).
- Para criar em um banco novo: crie o banco vazio e use `pg_restore -d novo_banco backup.dump`.

---

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Sobe API e Web. |
| `pnpm dev:api` | Só API. |
| `pnpm dev:web` | Só Web. |
| `pnpm --filter api exec prisma generate` | Gera o cliente Prisma (rode antes do seed se der erro). |
| `pnpm db:seed` | Recria usuário admin (seed). Rode `prisma generate` antes se precisar. |
| `pnpm db:studio` | Abre Prisma Studio no banco. |
| `docker compose -f infra/docker-compose.yml ps` | Status dos containers. |
| `docker compose -f infra/docker-compose.yml down` | Parar containers. |
| `./scripts/seed.sh` | Gera cliente Prisma e roda seed (carrega .env da raiz). |
| `./scripts/deploy-vps.sh` | Build + instala systemd para rodar em produção na VPS. |

### Se o `git pull` rejeitar por alterações locais

```bash
git checkout -- run-local.sh
git pull origin main
```

Depois rode `./run-local.sh` ou, só para generate + seed: `chmod +x scripts/seed.sh && ./scripts/seed.sh`.

### Rodar migrations e seed manualmente (com .env)

```bash
set -a && source .env && set +a
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy
pnpm db:seed
```

Ou use `./scripts/seed.sh` (já carrega .env e roda generate + seed).

---

## Rotinas automáticas (na API)

- **01:00:** atualização de faturas vencidas (status OVERDUE, multa/juros).
- **02:00:** backup (pg_dump, formato .dump) e registro em `backup_runs`.
- **06:00:** processamento de regras WhatsApp (outbox).
- **07:00:** geração de alertas (inadimplência, gastos, RH).

Faturas do mês: sob demanda via endpoint `POST /billing/generate`.
