# Plano prático — ERP Escolar completo (execução contínua)

## Objetivo
Executar a transformação completa do produto em 5 frentes: **RBAC, dados, operação escolar, financeiro, integrações/automação**, mantendo o design system nova era já aplicado.

## Fase 1 — Fundação crítica (RBAC + cadastro + matrícula)

### Entregáveis
- RBAC com perfis: professor/funcionário/coordenação/financeiro/admin_ceo.
- Matriz por domínio e baseline de enforcement no backend.
- Cadastro de escola/unidade/turma.
- Matrícula com documentos e timeline base do aluno.

### Entidades-base
- `User`, `Role`, `UserRole`, `Tenant`
- `Child`, `Guardian`, `ChildGuardian`
- `ChildAddress`, `AuthorizedPickup`, `ChildDocument`
- `Class`

### Critérios de aceite
- Usuário com papel `FINANCEIRO` não acessa endpoints acadêmicos sensíveis.
- Usuário com papel `PROFESSOR` não acessa endpoints financeiros.
- Timeline por aluno com eventos mínimos (matrícula/documento/ocorrência).

---

## Fase 2 — Financeiro Core

### Entregáveis
- Contas a receber recorrentes (mensalidades/cobranças)
- Contas a pagar (fixo + variável)
- Fluxo de caixa, inadimplência, custo por aluno

### Entidades
- `BillingCycle`, `Invoice`, `InvoiceItem`, `Payment`
- `ExpenseCategory`, `Expense`

### Critérios de aceite
- Geração de ciclo mensal sem duplicação por aluno
- Baixa de pagamento consistente e auditável
- Dashboard financeiro com comparativo período anterior

---

## Fase 3 — Operação acadêmica e RH

### Entregáveis
- Diário/frequência/ocorrências com trilha por aluno
- Ponto com geolocalização e validação de geofence
- Observações internas e gestão de equipe

### Entidades
- `DailyLog`, `DailyLogItem`, `CoordinationInboxItem`
- `StaffProfile`, `TimePunch`, `WorkSchedule`

### Critérios de aceite
- Registro de ponto com lat/lng/acurácia e alerta fora da área
- Aprovação de coordenação para eventos críticos
- Timeline escolar consolidada por aluno

---

## Fase 4 — Integrações e automações

### Entregáveis
- Asaas (cliente/cobrança/webhooks)
- Mensageria (WhatsApp/Telegram) + OCR de comprovantes
- Insights IA de custos/frequência/ponto

### Entidades sugeridas
- `ExternalCustomer`, `ExternalCharge`, `WebhookEvent`
- `DocumentInbox`, `DocumentOCRResult`
- `InsightRun`, `InsightItem`

### Critérios de aceite
- Webhook idempotente para eventos financeiros
- OCR gera sugestão de categoria e financeiro confirma
- Insight textual por período (semana/mês/trimestre/ano)

---

## Fase 5 — Produto vendável (go-to-market)

### Entregáveis
- Onboarding guiado por questionário
- Templates por tipo de escola
- Whitelabel completo e pacotes comerciais

### Critérios de aceite
- Nova escola ativada em fluxo único de onboarding
- Parametrização inicial sem intervenção manual técnica

---

## Backlog técnico inicial (issues prontas)
1. RBAC v1: papéis oficiais + enforcement por domínio
2. Matriz de permissão por endpoint + testes e2e
3. Timeline unificada do aluno
4. Financeiro core: geração de ciclo + baixa + inadimplência
5. Ponto geolocalizado com regra de geofence
6. Integração Asaas (core webhooks + idempotência)
7. OCR de comprovantes com fila de validação financeira
8. Motor de insights textuais por período
9. Onboarding wizard multi-etapas
10. Auditoria de alterações sensíveis

## Métricas de sucesso
- 0 acessos indevidos nos testes RBAC
- < 3 cliques para operações críticas no mobile PWA
- > 90% de consistência entre resumo textual e dados dos gráficos
- 99% de webhooks processados sem duplicidade
