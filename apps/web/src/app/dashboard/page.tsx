'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

interface Summary {
  billing: { totalExpected: number; totalPaid: number; totalPending: number; overdueCount: number };
  expenses: number;
  resultMonth: number;
  alerts: number;
  alertsList: { id: string; type: string; title: string; message: string }[];
  pendingInbox: number;
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiGet<Summary>('/dashboard/summary'),
  });

  if (isLoading) return <p className="text-slate-400">Carregando...</p>;
  if (error) return <p className="text-red-400">Erro ao carregar resumo.</p>;

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-slate-400 text-sm">Receita do mês</p>
          <p className="text-xl font-semibold text-green-400">{fmt(data!.billing.totalPaid)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Pendente</p>
          <p className="text-xl font-semibold">{fmt(data!.billing.totalPending)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Resultado do mês</p>
          <p className={`text-xl font-semibold ${data!.resultMonth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmt(data!.resultMonth)}
          </p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Em atraso</p>
          <p className="text-xl font-semibold text-amber-400">{data!.billing.overdueCount} fatura(s)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Termômetro / Alertas</h2>
          <p className="text-slate-400 text-sm mb-2">{data!.alerts} alerta(s) não lidos</p>
          <ul className="space-y-2">
            {data!.alertsList.slice(0, 5).map((a) => (
              <li key={a.id} className="text-sm border-l-2 border-amber-500 pl-2">
                {a.title}: {a.message}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">Inbox Coordenação</h2>
          <p className="text-slate-400">{data!.pendingInbox} item(ns) pendente(s) de revisão</p>
        </div>
      </div>
    </div>
  );
}
