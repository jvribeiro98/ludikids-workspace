---
version: alpha
name: Ludikids Nova Era
description: ERP escolar multi-tenant com estética moderna, profissional e intuitiva para desktop e PWA mobile completo.
colors:
  primary: "#4F46E5"
  brand-primary: "#4F46E5"
  brand-primary-600: "#4338CA"
  brand-secondary: "#06B6D4"
  accent-success: "#10B981"
  accent-warning: "#F59E0B"
  accent-danger: "#EF4444"
  bg-canvas: "#F8FAFC"
  bg-surface: "#FFFFFF"
  bg-elevated: "#F1F5F9"
  text-primary: "#0F172A"
  text-secondary: "#334155"
  text-muted: "#64748B"
  border-subtle: "#E2E8F0"
  overlay: "#020617"
  chart-1: "#4F46E5"
  chart-2: "#06B6D4"
  chart-3: "#10B981"
  chart-4: "#F59E0B"
  chart-5: "#EF4444"
  chart-6: "#8B5CF6"
typography:
  h1:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  h2:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.25
  h3:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.45
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.35
  numeric:
    fontFamily: "JetBrains Mono"
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.4
rounded:
  xs: 6px
  sm: 10px
  md: 14px
  lg: 18px
  xl: 24px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
elevation:
  card: "0 8px 24px rgba(15, 23, 42, 0.08)"
  popover: "0 16px 40px rgba(15, 23, 42, 0.14)"
  focus-ring: "0 0 0 3px rgba(79, 70, 229, 0.35)"
motion:
  fast: 150ms
  normal: 220ms
  slow: 320ms
components:
  page-shell:
    backgroundColor: "{colors.bg-canvas}"
    textColor: "{colors.text-primary}"
  sidebar-desktop:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.lg}"
    padding: 16px
  tabbar-mobile:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.xl}"
    padding: 10px
  card-default:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  card-kpi:
    backgroundColor: "{colors.bg-surface}"
    rounded: "{rounded.lg}"
    padding: 20px
  button-primary:
    backgroundColor: "{colors.brand-primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.brand-primary-600}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: 12px
  button-secondary:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: 12px
  input-default:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: 12px
  badge-success:
    backgroundColor: "#ECFDF5"
    textColor: "#047857"
    rounded: "{rounded.xs}"
    padding: 8px
  badge-warning:
    backgroundColor: "#FFFBEB"
    textColor: "#B45309"
    rounded: "{rounded.xs}"
    padding: 8px
  badge-danger:
    backgroundColor: "#FEF2F2"
    textColor: "#B91C1C"
    rounded: "{rounded.xs}"
    padding: 8px
  chart-card:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 20px
  summary-drawer:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    padding: 16px
---

## Overview

Design system para um ERP escolar comercial com duas experiências complementares: desktop (gestão analítica) e PWA mobile completo (execução operacional e gestão em campo). O estilo é "nova era": profundidade visual, microinterações, superfícies sofisticadas e clareza extrema de uso.

## Colors

- **Primary (#4F46E5):** identidade e CTA principal.
- **Secondary (#06B6D4):** apoio em elementos de navegação e estado ativo.
- **Success/Warning/Danger:** estados semânticos para financeiro, presença e alertas.
- **Backgrounds frios neutros:** legibilidade alta e ar profissional.
- **Paleta de gráficos dedicada:** consistência entre visões e comparações temporais.

## Typography

- **Inter** como fonte principal para leitura rápida em UI densa.
- **JetBrains Mono** para números críticos (valores, percentuais, IDs, protocolo).
- Escala compacta com alta legibilidade no mobile.

## Layout

- Grid desktop de 12 colunas (cards modulares).
- Grid mobile de 4 colunas com blocos empilhados.
- Espaçamento por escala fixa para previsibilidade visual.
- Navegação:
  - Desktop: sidebar + topbar com busca global.
  - Mobile PWA: bottom tab bar + quick actions contextuais.

## Elevation & Depth

- Cartões e painéis com sombras suaves para agrupamento.
- Elevação maior apenas para popovers/modais críticos.
- Focus ring semântico no primary para acessibilidade visual.

## Shapes

- Cantos arredondados progressivos por importância.
- Botões e inputs com raio uniforme para consistência.
- Blocos de KPI com maior raio para destacar prioridade.

## Components

### Padrões essenciais

1. **KPI Cards**: valor atual, variação (%), mini tendência, comparação período anterior.
2. **Chart Cards**: seletor de período (semana/mês/trimestre/ano) + seletor de visualização (linha/barra/área/heatmap/waterfall).
3. **Resumo em texto (drawer/inline)**: botão "Resumo" que abre texto explicativo do período atual em linguagem simples.
4. **Data Tables híbridas**: desktop com tabela completa; mobile com cards expansíveis da mesma fonte de dados.
5. **Alert Chips**: risco financeiro, inadimplência, ponto fora da área, queda pedagógica.
6. **Timeline Unificada**: aluno/funcionário com eventos cronológicos e filtros por tipo.
7. **Action Rail Mobile**: ações rápidas fixas (Ponto, Diário, Ocorrência, Recebimento, Aprovação).

### Regras de gráfico + resumo

- Todo gráfico estratégico deve ter:
  - legenda consistente
  - alternância de visualização
  - comparação temporal
  - CTA "Abrir resumo"
- O resumo textual deve incluir:
  - período analisado
  - principal variação positiva/negativa
  - causa provável (com base em dados internos)
  - ação recomendada curta

## Do's and Don'ts

### Do
- Priorizar clareza sem abrir mão de estética.
- Usar animações curtas e funcionais.
- Oferecer visão completa no PWA (sem amputar módulos).
- Adaptar o mesmo domínio de dados para UX desktop e mobile.

### Don't
- Não esconder funções críticas no mobile.
- Não usar excesso de efeito visual que atrapalhe leitura.
- Não criar gráficos sem contexto textual/resumo.
- Não quebrar consistência de componentes entre telas.