'use client';

import { useMemo, useState } from 'react';

export type ChartPeriod = 'semana' | 'mes' | 'trimestre' | 'ano';
export type ChartType = 'linha' | 'barra' | 'area' | 'heatmap' | 'waterfall';

type Point = { label: string; value: number };

type SmartChartProps = {
  title: string;
  subtitle?: string;
  series: Point[];
  initialType?: ChartType;
  initialPeriod?: ChartPeriod;
  onPeriodChange?: (period: ChartPeriod) => void;
};

const PERIODS: ChartPeriod[] = ['semana', 'mes', 'trimestre', 'ano'];
const TYPES: ChartType[] = ['linha', 'barra', 'area', 'heatmap', 'waterfall'];

export function SmartChart({
  title,
  subtitle,
  series,
  initialType = 'barra',
  initialPeriod = 'mes',
  onPeriodChange,
}: SmartChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>(initialPeriod);
  const [type, setType] = useState<ChartType>(initialType);

  const max = useMemo(() => Math.max(...series.map((s) => s.value), 1), [series]);

  function handlePeriodChange(next: ChartPeriod) {
    setPeriod(next);
    onPeriodChange?.(next);
  }

  return (
    <section className="lk-card lk-chart-card">
      <header className="lk-chart-header">
        <div>
          <h3 className="lk-h3">{title}</h3>
          {subtitle ? <p className="lk-text-muted">{subtitle}</p> : null}
        </div>
        <div className="lk-chart-controls">
          <select value={period} onChange={(e) => handlePeriodChange(e.target.value as ChartPeriod)} aria-label="Período">
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as ChartType)} aria-label="Tipo do gráfico">
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </header>

      {type === 'heatmap' ? (
        <div className="lk-heatmap" role="img" aria-label="Mapa de calor de valores">
          {series.map((item) => {
            const intensity = Math.max(0.2, item.value / max);
            return (
              <div
                key={item.label}
                className="lk-heat-cell"
                style={{ background: `color-mix(in srgb, var(--brand-primary) ${Math.round(intensity * 100)}%, #fff)` }}
                title={`${item.label}: ${item.value}`}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`lk-chart-plot lk-${type}`}>
          {series.map((item, index) => {
            const ratio = item.value / max;
            const height = Math.max(10, Math.round(ratio * 160));
            const waterfallBase = index === 0 ? 0 : Math.min(series[index - 1].value, item.value);
            const waterfallDiff = Math.abs(item.value - waterfallBase);
            return (
              <div key={item.label} className="lk-chart-col">
                <div
                  className="lk-chart-bar"
                  style={{
                    height: `${type === 'waterfall' ? Math.max(8, (waterfallDiff / max) * 140) : height}px`,
                    marginTop: type === 'waterfall' ? `${Math.max(0, (waterfallBase / max) * 120)}px` : undefined,
                  }}
                  title={`${item.label}: ${item.value}`}
                />
                <span className="lk-chart-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
