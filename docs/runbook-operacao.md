# Runbook de Operação — LudiKids Workspace

## 1) Pré-check rápido
```bash
pnpm verify
```
Esperado: lint/build web e api + teste billing verde.

## 2) Deploy (VM 10.10.10.109)
```bash
cd /opt/ludikids-workspace
git fetch origin
git reset --hard origin/main
docker compose --env-file .env -f infra/docker-compose.full.yml up -d --build api web caddy
docker compose --env-file .env -f infra/docker-compose.full.yml ps
```
Esperado: `api` e `web` com status `healthy`.

## 3) Smoke funcional (produção)
- Login em `/login`
- Navegação dashboard respeitando RBAC por perfil
- Financeiro: abrir competência, carregar resumo/faturas/conciliação
- Comunicação: processar regras (stub) sem erro

## 4) Diagnóstico rápido
### API logs
```bash
docker logs --tail 200 ludikids-api
```
### WEB logs
```bash
docker logs --tail 200 ludikids-web
```
### Caddy logs
```bash
docker logs --tail 200 ludikids-caddy
```

## 5) Incidentes comuns
- **UI sem atualização após deploy**: limpar cache/service worker do navegador.
- **401 em cascata**: validar `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`.
- **CORS em produção**: conferir `WEB_ORIGIN` no `.env`.

## 6) Rollback
```bash
cd /opt/ludikids-workspace
git reflog --date=local -n 10
git reset --hard <commit-anterior>
docker compose --env-file .env -f infra/docker-compose.full.yml up -d --build api web caddy
```

## 7) Checklist de fechamento
- [ ] `pnpm verify` passou
- [ ] Deploy com containers `healthy`
- [ ] Smoke funcional em produção ok
- [ ] Sem erro novo em logs críticos
