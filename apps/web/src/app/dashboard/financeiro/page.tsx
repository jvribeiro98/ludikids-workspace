'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;

export default function FinanceiroPage() {
  const [billingCycleId, setBillingCycleId] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ invoiceId: string; total: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CASH' | 'CARD' | 'TRANSFER'>('PIX');
  const queryClient = useQueryClient();

  const { data: cycle } = useQuery({
    queryKey: ['billing-cycle', year, month],
    queryFn: () => apiGet<{ id: string }>(`/billing/cycles?year=${year}&month=${month}`),
  });

  const { data: summary } = useQuery({
    queryKey: ['billing-summary', year, month],
    queryFn: () => apiGet<{ totalExpected: number; totalPaid: number; totalPending: number; overdueCount: number }>(`/billing/summary?year=${year}&month=${month}`),
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', cycle?.id],
    queryFn: () => apiGet<any[]>(`/billing/invoices?billingCycleId=${cycle?.id}`),
    enabled: !!cycle?.id,
  });

  const payMutation = useMutation({
    mutationFn: (body: { invoiceId: string; amount: number; method: string }) =>
      apiPost('/payments', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      setPaymentModal(null);
      setPaymentAmount('');
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ['expenses', year, month],
    queryFn: () =>
      apiGet<any[]>(`/expenses?start=${year}-${String(month).padStart(2, '0')}-01&end=${year}-${String(month).padStart(2, '0')}-31`),
  });

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financeiro</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-slate-400 text-sm">Previsto</p>
          <p className="text-lg font-semibold">{summary ? fmt(summary.totalExpected) : '-'}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Recebido</p>
          <p className="text-lg font-semibold text-green-400">{summary ? fmt(summary.totalPaid) : '-'}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Pendente</p>
          <p className="text-lg font-semibold">{summary ? fmt(summary.totalPending) : '-'}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-sm">Em atraso</p>
          <p className="text-lg font-semibold text-amber-400">{summary?.overdueCount ?? 0}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Faturas da competência {month}/{year}</h2>
        {isLoading && <p className="text-slate-400">Carregando...</p>}
        {invoices && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left text-sm text-slate-400">
                <th className="p-2">Criança</th>
                <th className="p-2">Vencimento</th>
                <th className="p-2">Total</th>
                <th className="p-2">Pago</th>
                <th className="p-2">Status</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b border-slate-700/50">
                  <td className="p-2">{inv.child?.name}</td>
                  <td className="p-2">{new Date(inv.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="p-2">{fmt(Number(inv.total))}</td>
                  <td className="p-2">{fmt(Number(inv.paidAmount))}</td>
                  <td className="p-2">{inv.status}</td>
                  <td className="p-2">
                    {inv.status !== 'PAID' && (
                      <button
                        className="btn btn-primary text-sm py-1"
                        onClick={() => {
                          setPaymentModal({ invoiceId: inv.id, total: Number(inv.total) });
                          setPaymentAmount(String(inv.total));
                        }}
                      >
                        Registrar pagamento
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {invoices?.length === 0 && cycle?.id && (
          <p className="text-slate-400 py-4">Nenhuma fatura. Gere faturas pela API (POST /billing/generate).</p>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Gastos do mês</h2>
        <p className="text-slate-400">
          Total: {expenses ? fmt(expenses.reduce((s: number, e: any) => s + Number(e.amount), 0)) : '-'}
        </p>
        <p className="text-sm text-slate-500 mt-2">CRUD de gastos disponível na API (GET/POST /expenses).</p>
      </div>

      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
          <div className="card max-w-sm w-full">
            <h2 className="font-semibold mb-4">Registrar pagamento</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                payMutation.mutate({
                  invoiceId: paymentModal.invoiceId,
                  amount: parseFloat(paymentAmount),
                  method: paymentMethod,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="label">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Forma</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                  <option value="PIX">PIX</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="CARD">Cartão</option>
                  <option value="TRANSFER">Transferência</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setPaymentModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={payMutation.isPending}>Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
