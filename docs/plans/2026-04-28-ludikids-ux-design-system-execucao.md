# Ludikids UX Nova Era — Plano Prático de Execução

> Escopo aprovado: produto completo em Desktop + PWA mobile completo, design inovador/profissional, gráficos com múltiplas visualizações e resumo textual contextual por período.

## Objetivo

Implementar uma camada visual consistente e escalável para todo o ERP escolar, mantendo paridade funcional entre desktop e PWA mobile e elevando a experiência para padrão comercial vendável.

## Arquitetura visual (decisão)

- **Design token-driven**: fonte única em `docs/design/DESIGN.md`.
- **UI foundation**: biblioteca de componentes internos (tokens + primitives + patterns).
- **Data-viz padrão**: wrappers de gráfico com alternância de tipo + resumo textual.
- **Paridade funcional**: todas as features no mobile, com ergonomia própria.

---

## Fase 0 — Base visual (2 dias)

### Entregáveis
- Tokens oficiais (cores, tipografia, spacing, raios, sombras, motion).
- Guia de estados (hover, active, focus, loading, disabled, erro, sucesso).
- Tema claro padrão + estrutura pronta para tema por tenant.

### Arquivos-alvo (sugestão)
- `apps/web/src/styles/tokens.css`
- `apps/web/src/styles/theme.css`
- `apps/web/src/components/ui/*`
- `docs/design/DESIGN.md`

### Critério de aceite
- Componentes base renderizando com mesmo padrão visual em todas as páginas.

---

## Fase 1 — Shell de navegação (2 dias)

### Entregáveis
- Shell desktop: sidebar, topbar, busca global, notificações.
- Shell mobile PWA: bottom tab, app header, quick actions.
- Sistema de breadcrumbs + contexto de tenant/unidade.

### Critério de aceite
- 100% dos módulos acessíveis em desktop e mobile (mesmo que parte esteja em modo beta).

---

## Fase 2 — Componentes críticos (3 dias)

### Entregáveis
1. **KPI Cards** com tendência e comparação temporal.
2. **Tabela responsiva híbrida** (desktop tabela, mobile cards expansíveis).
3. **Timeline unificada** (aluno/funcionário).
4. **Command palette** para atalhos rápidos.
5. **Blocos de alertas inteligentes** com severidade.

### Critério de aceite
- Sem duplicação de regra visual; todos módulos usam primitives do design system.

---

## Fase 3 — DataViz + Resumo textual (3 dias)

### Entregáveis
- Componente `SmartChart` com tipos:
  - linha, barra, área empilhada, heatmap, waterfall
- Filtro temporal universal:
  - semana, mês, trimestre, ano, personalizado
- Componente `InsightSummary`:
  - "Abrir resumo" com texto explicativo do período

### Regra funcional do resumo
- Para cada período selecionado, gerar:
  1) contexto do período
  2) principal variação
  3) possível causa
  4) ação sugerida

### Critério de aceite
- Todo dashboard executivo e operacional com gráfico + resumo coerente.

---

## Fase 4 — PWA completo (4 dias)

### Entregáveis
- Offline first para ações essenciais (fila local + sync):
  - ponto
  - diário
  - ocorrências
  - anexos de comprovantes
- Camera/file capture otimizada.
- UX touch otimizada (área de toque, teclado, feedback háptico quando disponível).

### Critério de aceite
- Operação principal funcionando em smartphone sem dependência de desktop.

---

## Fase 5 — Polimento comercial (2 dias)

### Entregáveis
- Empty states com orientação.
- Mensagens de erro humanas e acionáveis.
- Modo apresentação executiva (reunião com mantenedor/CEO).
- Acessibilidade (contraste, foco teclado, labels).

### Critério de aceite
- Produto visualmente pronto para demo comercial.

---

## Backlog funcional visual por módulo

## 1) Financeiro
- Dashboard com caixa, inadimplência, custo por aluno.
- Gráficos comparativos + resumo textual por período.
- Fluxo de aprovação visual para despesas.

## 2) Acadêmico
- Diário com UX de lançamento rápido.
- Timeline por aluno com filtros e tags.
- Calendário global com camadas (acadêmico/administrativo).

## 3) RH
- Ponto por geolocalização com mapa compacto.
- Painel de jornada/atrasos/alertas.
- Contracheque e histórico com visual limpo.

## 4) Secretaria
- Matrícula guiada em etapas.
- Checklist documental com progresso.
- Linha do tempo de atendimento/follow-up.

## 5) Gestão
- Cockpit executivo com KPIs e insights textuais.
- Modo apresentação com menos ruído e mais narrativa.

---

## Regras de inovação (com profissionalismo)

1. Motion curta (150–250ms), nunca ornamental demais.
2. Sombras e depth para hierarquia, não para enfeite.
3. Gradientes controlados em pontos de destaque.
4. Ícones consistentes e semânticos.
5. Conteúdo sempre vence efeito visual.

---

## Métricas de sucesso da UX

- Tempo para completar tarefa crítica (ex.: lançar diário) < 60s.
- Taxa de erro de operação mobile reduzida.
- Usuário encontra KPI-chave em < 10s.
- Adoção do recurso de resumo textual > 40% em dashboards.

---

## O que foi ajustado conforme seu feedback

- Removido conceito de PWA "limitado".
- Definido oficialmente: **PWA mobile com foco geral em tudo**, com UX adaptada para tela pequena.
- Desktop permanece como experiência analítica ampliada.

---

## Próxima execução autônoma (após sua aprovação)

1. Implementar tokens e primitives na web app.
2. Migrar dashboards para `SmartChart + InsightSummary`.
3. Padronizar navegação desktop/mobile com paridade funcional.
4. Aplicar componentes por domínio (Financeiro, Acadêmico, RH, Secretaria).
5. Validar responsividade e acessibilidade.
6. Abrir PR incremental com checklists por módulo.
