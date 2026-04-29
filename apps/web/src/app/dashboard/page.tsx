'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useBranding } from '@/components/BrandingProvider';
import { useAuth } from '@/contexts/AuthContext';
import { SmartChart, type ChartPeriod } from '@/components/dashboard/SmartChart';
import { InsightSummary } from '@/components/dashboard/InsightSummary';
import { MANAGEMENT_ROLES, hasAnyRole } from '@/lib/rbac';

interface Summary {
  billing: { totalExpected: number; totalPaid: number; totalPending: number; overdueCount: number };
  childrenCount: number;
  contractsActiveCount: number;
}

type Alert = { id: string; level: string; message: string; createdAt: string };

function money(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'];

export default function DashboardPage() {
  const { user } = useAuth();
  const canAccess = hasAnyRole(user?.roles, MANAGEMENT_ROLES);
  const { branding } = useBranding();
  const [period, setPeriod] = useState<ChartPeriod>('mes');

  const summaryQuery = useQuery({ queryKey: ['summary'], queryFn: () => apiGet<Summary>('/dashboard/summary') });
  const alertsQuery = useQuery({ queryKey: ['alerts'], queryFn: () => apiGet<Alert[]>('/alerts') });

  const summary = summaryQuery.data;
  const alerts = alertsQuery.data ?? [];

  const fakeTrend = useMemo(() => [52, 48, 60, 57, 69, 63, 71, 80], []);
  const series = useMemo(() => monthNames.map((label, i) => ({ label, value: fakeTrend[i] })), [fakeTrend]);

  const currentValue = summary?.billing.totalPaid ?? 0;
  const previousValue = summary?.billing.totalExpected ?? 1;

  if (!canAccess) {
    return (
      <div className="lk-card">
        <h1 className="text-2xl font-bold">Cockpit operacional</h1>
        <p className="text-red-700 font-medium mt-2">Você não possui permissão para acessar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      <section className="xl:col-span-9 space-y-4">
        <div className="lk-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cockpit operacional</h1>
            <p className="lk-text-muted">Visão geral acadêmica, RH e financeiro com leitura rápida</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <input placeholder="Buscar aluno, contrato ou fatura" className="md:w-80" />
            <button className="btn btn-secondary" aria-label="Notificações">🔔</button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Alunos" value={summary?.childrenCount ?? 0} gradient="linear-gradient(160deg, #06b6d4, #0891b2)" helper="base ativa" />
          <MetricCard label="Contratos ativos" value={summary?.contractsActiveCount ?? 0} gradient="linear-gradient(160deg, #8b5cf6, #7c3aed)" helper="em execução" />
          <MetricCard label="Faturas em aberto" value={summary?.billing.overdueCount ?? 0} gradient="linear-gradient(160deg, #f59e0b, #d97706)" helper="requer atenção" />
          <MetricCard label="Recebido no período" value={money(summary?.billing.totalPaid ?? 0)} gradient="linear-gradient(160deg, #4f46e5, #4338ca)" helper="meta financeira" />
        </div>

        <SmartChart
          title="Financeiro: tendência por período"
          subtitle="Alterne visualização para leitura executiva e operacional"
          series={series}
          onPeriodChange={setPeriod}
        />

        <InsightSummary
          period={period}
          metricName="recebimento"
          currentValue={currentValue}
          previousValue={previousValue}
        />

        <div className="lk-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Alertas e pendências</h2>
            <button className="btn btn-secondary text-sm" onClick={() => alertsQuery.refetch()}>Atualizar</button>
          </div>
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {alertsQuery.isLoading && <p className="lk-text-muted">Carregando alertas...</p>}
            {alertsQuery.isError && <p className="text-red-600 text-sm">Erro ao carregar alertas.</p>}
            {!alertsQuery.isLoading && !alertsQuery.isError && alerts.length === 0 && (
              <p className="lk-text-muted">Sem alertas no momento.</p>
            )}
            {alerts.slice(0, 10).map((a) => (
              <div key={a.id} className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--brand-primary) 8%, white)' }}>
                <p className="text-sm font-medium">{a.message}</p>
                <p className="text-xs mt-1 lk-text-muted">{new Date(a.createdAt).toLocaleString('pt-BR')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="xl:col-span-3 space-y-4">
        <div className="lk-card text-center">
          <Image src={branding.logoUrl} alt={branding.brandName} width={64} height={64} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-2 border" style={{ borderColor: 'var(--brand-border)' }} unoptimized />
          <h3 className="font-bold">{branding.brandName}</h3>
          <p className="text-sm lk-text-muted">{branding.brandSubtitle}</p>
        </div>

        <div className="lk-card">
          <h3 className="font-semibold mb-3">Agenda global</h3>
          <ul className="space-y-2 text-sm">
            <li className="rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--brand-secondary) 20%, white)' }}>05/07 • Reunião com responsáveis inadimplentes</li>
            <li className="rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--brand-primary) 12%, white)' }}>12/07 • Fechamento parcial do caixa</li>
            <li className="rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--brand-accent) 18%, white)' }}>25/07 • Revisão de contratos e reajustes</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function MetricCard({ label, value, gradient, helper }: { label: string; value: string | number; gradient: string; helper: string }) {
  return (
    <article className="lk-kpi" style={{ background: gradient }}>
      <p className="lk-kpi-title">{label}</p>
      <p className="lk-kpi-value lk-text-number">{value}</p>
      <p className="lk-kpi-meta">{helper}</p>
    </article>
  );
}
