'use client';

import { useMemo, useState } from 'react';
import type { ChartPeriod } from './SmartChart';

type InsightSummaryProps = {
  period: ChartPeriod;
  metricName: string;
  currentValue: number;
  previousValue: number;
};

function pct(current: number, previous: number) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

export function InsightSummary({ period, metricName, currentValue, previousValue }: InsightSummaryProps) {
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    const variation = pct(currentValue, previousValue);
    const trend = variation >= 0 ? 'subiu' : 'caiu';
    const abs = Math.abs(variation).toFixed(1);

    return {
      headline: `No ${period}, ${metricName} ${trend} ${abs}% em relação ao período anterior.`,
      cause:
        variation >= 0
          ? 'O aumento pode estar ligado a maior atividade operacional, recorrências ou ajustes recentes.'
          : 'A queda pode indicar sazonalidade, redução de volume ou melhora de eficiência em custos.',
      action:
        variation >= 0
          ? 'Revisar os 3 maiores itens de impacto e validar se o crescimento é saudável para a meta atual.'
          : 'Confirmar se a redução é sustentável e registrar o padrão como referência para próximo ciclo.',
    };
  }, [period, metricName, currentValue, previousValue]);

  return (
    <section className="lk-summary-wrap">
      <button className="btn btn-secondary" onClick={() => setOpen((v) => !v)}>
        {open ? 'Fechar resumo' : 'Abrir resumo'}
      </button>

      {open ? (
        <article className="lk-summary-drawer">
          <p className="lk-summary-headline">{summary.headline}</p>
          <p className="lk-text-muted">{summary.cause}</p>
          <p className="lk-summary-action">Ação sugerida: {summary.action}</p>
        </article>
      ) : null}
    </section>
  );
}
