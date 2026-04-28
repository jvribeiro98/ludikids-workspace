# Plano de 18h — Estabilização do ludikids-workspace

> Execução orientada a resultado público: CI verde, deploy previsível, funcionalidades core estáveis.

**Objetivo:** estabilizar backend + frontend com escopo reduzido (core), mantendo stack atual e reduzindo complexidade operacional.

**Arquitetura alvo (v1):**
- Manter monorepo pnpm (apps/api + apps/web)
- Manter NestJS + Prisma + PostgreSQL no backend
- Manter Next.js no frontend
- Congelar módulos não-core para diminuir risco

**Escopo Core v1 (ativo):**
- Auth/Users
- Children/Guardians
- Contracts + Billing/Payments básico
- Dashboard/Health

**Escopo Secundário (congelado temporariamente):**
- HR
- WhatsApp
- Backups
- Alerts avançados
- Jobs não-críticos

---

## Bloco 0 (1h) — Preparação e trilho seguro
- [ ] Validar branch de trabalho e sync com remoto
- [ ] Conferir variáveis essenciais no CI (sem expor segredos)
- [ ] Confirmar workflows ativos: ci.yml + deploy-pages.yml
- [ ] Registrar plano no issue mestre

**Critério de saída:** trilho de execução definido + visível no GitHub.

## Bloco 1 (3h) — Racionalização de escopo (sem trocar stack)
- [ ] Marcar módulos core vs secundários no backend
- [ ] Ajustar AppModule/feature flags para evitar boot de módulos congelados
- [ ] Garantir que rotas core sobem sem dependências secundárias
- [ ] Atualizar documentação de limites v1

**Critério de saída:** backend sobe e responde com escopo core limpo.

## Bloco 2 (4h) — Backend hardening
- [ ] Padronizar validação de DTOs e erros HTTP
- [ ] Revisar fluxo de auth/refresh token
- [ ] Revisar serviços críticos: users/children/contracts/billing
- [ ] Adicionar testes unitários focados em regras de negócio críticas

**Critério de saída:** testes backend core verdes + erros previsíveis.

## Bloco 3 (4h) — Frontend hardening
- [ ] Padronizar estados loading/empty/error nas telas core
- [ ] Revisar camada de API client (retry/401/redirect/login)
- [ ] Corrigir fluxos quebrados em pages core
- [ ] Adicionar smoke tests mínimos (build + navegação principal)

**Critério de saída:** UX core consistente e sem regressões óbvias.

## Bloco 4 (3h) — Banco e integridade
- [ ] Revisar índices e constraints mais usados no core
- [ ] Garantir coerência tenantId nas entidades críticas
- [ ] Revisar migrações Prisma para previsibilidade no CI
- [ ] Seed mínima determinística para testes

**Critério de saída:** schema coerente para core + migração/seed reproduzíveis.

## Bloco 5 (3h) — Operação, CI e prova pública
- [ ] Fortalecer pipeline (lint/test/build com falhas claras)
- [ ] Validar deploy em GitHub Pages (frontend estático) + API URL
- [ ] Criar checklist de release e rollback
- [ ] Fechar issues do ciclo com evidências (runs, links, prints)

**Critério de saída:** CI verde + deploy verificável + documentação operacional.

---

## Ordem de execução recomendada
1. Bloco 0
2. Bloco 1
3. Blocos 2 e 3 (intercalado por dependências)
4. Bloco 4
5. Bloco 5

## Definição de pronto (DoD)
- CI principal verde por pelo menos 2 execuções consecutivas
- Frontend publicado e acessível
- Fluxos core funcionando: login, cadastro/listagem criança, contrato, geração/estado de fatura
- Sem regressão crítica aberta nas issues do ciclo
- Runbook curto de operação disponível no repositório
