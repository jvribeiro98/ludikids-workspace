'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

const now = new Date();

type ReconciliationSummary = {
  totalInvoices: number;
  expectedTotal: number;
  invoicePaidTotal: number;
  paymentsTotal: number;
  paidVsPaymentsDelta: number;
  divergentCount: number;
};

type ReconciliationRow = {
  invoiceId: string;
  childName: string;
  status: string;
  invoicePaid: number;
  paymentsTotal: number;
  delta: number;
};

type ReconciliationHistoryRow = {
  id: string;
  createdAt: string;
  userId?: string;
  invoiceId?: string;
  oldData?: { paidAmount?: number; status?: string };
  newData?: { paidAmount?: number; status?: string };
};

export default function FinanceiroPage() {
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [paymentModal, setPaymentModal] = useState<{ invoiceId: string; total: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CASH' | 'CARD' | 'TRANSFER'>('PIX');
  const [uiError, setUiError] = useState('');
  const queryClient = useQueryClient();

  const { data: cycle } = useQuery({
    queryKey: ['billing-cycle', selectedYear, selectedMonth],
    queryFn: () => apiGet<{ id: string }>(`/billing/cycles?year=${selectedYear}&month=${selectedMonth}`),
  });

  const { data: summary, isError: summaryError, refetch: refetchSummary } = useQuery({
    queryKey: ['billing-summary', selectedYear, selectedMonth],
    queryFn: () => apiGet<{ totalExpected: number; totalPaid: number; totalPending: number; overdueCount: number }>(`/billing/summary?year=${selectedYear}&month=${selectedMonth}`),
  });

  const {
    data: reconciliation,
    isError: reconciliationError,
    refetch: refetchReconciliation,
  } = useQuery({
    queryKey: ['billing-reconciliation', selectedYear, selectedMonth],
    queryFn: () =>
      apiGet<{ summary: ReconciliationSummary; divergentInvoices: ReconciliationRow[] }>(
        `/billing/reconciliation?year=${selectedYear}&month=${selectedMonth}`,
      ),
  });

  const { data: reconciliationHistory, refetch: refetchReconciliationHistory } = useQuery({
    queryKey: ['billing-reconciliation-history', selectedYear, selectedMonth],
    queryFn: () =>
      apiGet<ReconciliationHistoryRow[]>(`/billing/reconciliation/history?year=${selectedYear}&month=${selectedMonth}&limit=20`),
  });

  const { data: invoices, isLoading, isError: invoicesError, refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices', cycle?.id],
    queryFn: () => apiGet<any[]>(`/billing/invoices?billingCycleId=${cycle?.id}`),
    enabled: !!cycle?.id,
  });

  const payMutation = useMutation({
    mutationFn: (body: { invoiceId: string; amount: number; method: string }) => apiPost('/payments', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['billing-reconciliation'] });
      setPaymentModal(null);
      setPaymentAmount('');
      setUiError('');
    },
    onError: (err: Error) => setUiError(err.message || 'Falha ao registrar pagamento.'),
  });

  const { data: expenses } = useQuery({
    queryKey: ['expenses', selectedYear, selectedMonth],
    queryFn: () => apiGet<any[]>(`/expenses?start=${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01&end=${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`),
  });

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  const availableYears = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i);

  return (
    <div className="space-y-4">
      <div className="lk-card">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="lk-text-muted">Controle de recebíveis, faturas e despesas com leitura operacional rápida.</p>
        <div className="mt-4 flex gap-2 flex-wrap items-end">
          <div>
            <label className="label">Mês</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Ano</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(summaryError || invoicesError || reconciliationError) && (
        <div className="lk-card">
          <p className="text-red-700 font-medium">Erro ao carregar dados financeiros.</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <button className="btn btn-secondary" onClick={() => refetchSummary()}>Atualizar resumo</button>
            <button className="btn btn-secondary" onClick={() => refetchInvoices()}>Atualizar faturas</button>
            <button className="btn btn-secondary" onClick={() => refetchReconciliation()}>Atualizar conciliação</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric title="Previsto" value={summary ? fmt(summary.totalExpected) : '-'} tone="var(--brand-secondary)" />
        <Metric title="Recebido" value={summary ? fmt(summary.totalPaid) : '-'} tone="var(--brand-success)" />
        <Metric title="Pendente" value={summary ? fmt(summary.totalPending) : '-'} tone="var(--brand-warning)" />
        <Metric title="Em atraso" value={String(summary?.overdueCount ?? 0)} tone="var(--brand-danger)" />
      </div>

      <div className="lk-card">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="font-semibold">Conciliação financeira ({selectedMonth}/{selectedYear})</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="btn btn-primary"
              onClick={async () => {
                setUiError('');
                try {
                  await apiPost('/billing/reconciliation/reconcile-all', { year: selectedYear, month: selectedMonth });
                  await Promise.all([
                    refetchReconciliation(),
                    refetchInvoices(),
                    refetchSummary(),
                    refetchReconciliationHistory(),
                  ]);
                } catch (err: any) {
                  setUiError(err?.message || 'Falha ao reconciliar todas as faturas divergentes.');
                }
              }}
              disabled={(reconciliation?.summary.divergentCount ?? 0) === 0}
            >
              Reconciliar todas
            </button>
            <button className="btn btn-secondary" onClick={() => refetchReconciliation()}>
              Atualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Metric title="Pago em faturas" value={fmt(reconciliation?.summary.invoicePaidTotal ?? 0)} tone="var(--brand-secondary)" />
          <Metric title="Pago em lançamentos" value={fmt(reconciliation?.summary.paymentsTotal ?? 0)} tone="var(--brand-primary)" />
          <Metric
            title="Delta pago x lançamentos"
            value={fmt(reconciliation?.summary.paidVsPaymentsDelta ?? 0)}
            tone={Math.abs(reconciliation?.summary.paidVsPaymentsDelta ?? 0) >= 0.01 ? 'var(--brand-danger)' : 'var(--brand-success)'}
          />
          <Metric
            title="Faturas divergentes"
            value={String(reconciliation?.summary.divergentCount ?? 0)}
            tone={(reconciliation?.summary.divergentCount ?? 0) > 0 ? 'var(--brand-danger)' : 'var(--brand-success)'}
          />
        </div>

        {(reconciliation?.divergentInvoices?.length ?? 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}>
                  <th className="p-3 text-left">Criança</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Pago na fatura</th>
                  <th className="p-3 text-left">Soma de pagamentos</th>
                  <th className="p-3 text-left">Delta</th>
                  <th className="p-3 text-left">Ação</th>
                </tr>
              </thead>
              <tbody>
                {reconciliation?.divergentInvoices.map((row) => (
                  <tr key={row.invoiceId} className="border-b" style={{ borderColor: 'var(--brand-border)' }}>
                    <td className="p-3">{row.childName}</td>
                    <td className="p-3">{row.status}</td>
                    <td className="p-3 lk-text-number">{fmt(row.invoicePaid)}</td>
                    <td className="p-3 lk-text-number">{fmt(row.paymentsTotal)}</td>
                    <td className="p-3 lk-text-number" style={{ color: 'var(--brand-danger)' }}>{fmt(row.delta)}</td>
                    <td className="p-3">
                      <button
                        className="btn btn-secondary text-sm py-1"
                        onClick={async () => {
                          setUiError('');
                          try {
                            await apiPost('/billing/reconciliation/reconcile-invoice', { invoiceId: row.invoiceId });
                            await Promise.all([
                              refetchReconciliation(),
                              refetchInvoices(),
                              refetchSummary(),
                              refetchReconciliationHistory(),
                            ]);
                          } catch (err: any) {
                            setUiError(err?.message || 'Falha ao reconciliar fatura.');
                          }
                        }}
                      >
                        Reconciliar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="lk-text-muted">Sem divergências para a competência atual.</p>
        )}
      </div>

      <div className="lk-card">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="font-semibold">Histórico de conciliações ({selectedMonth}/{selectedYear})</h2>
          <button className="btn btn-secondary" onClick={() => refetchReconciliationHistory()}>
            Atualizar histórico
          </button>
        </div>

        {(reconciliationHistory?.length ?? 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Fatura</th>
                  <th className="p-3 text-left">Usuário</th>
                  <th className="p-3 text-left">Pago (antes)</th>
                  <th className="p-3 text-left">Pago (depois)</th>
                  <th className="p-3 text-left">Status (antes → depois)</th>
                </tr>
              </thead>
              <tbody>
                {reconciliationHistory?.map((row) => (
                  <tr key={row.id} className="border-b" style={{ borderColor: 'var(--brand-border)' }}>
                    <td className="p-3">{new Date(row.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="p-3 lk-text-number">{row.invoiceId ?? '-'}</td>
                    <td className="p-3">{row.userId ?? 'sistema'}</td>
                    <td className="p-3 lk-text-number">{fmt(Number(row.oldData?.paidAmount ?? 0))}</td>
                    <td className="p-3 lk-text-number">{fmt(Number(row.newData?.paidAmount ?? 0))}</td>
                    <td className="p-3">{row.oldData?.status ?? '-'} → {row.newData?.status ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="lk-text-muted">Sem histórico de conciliação para esta competência.</p>
        )}
      </div>

      <div className="lk-card overflow-hidden p-0">
        <div className="p-4 border-b" style={{ borderColor: 'var(--brand-border)' }}>
          <h2 className="font-semibold">Faturas da competência {selectedMonth}/{selectedYear}</h2>
        </div>
        {isLoading && <p className="p-4 lk-text-muted">Carregando...</p>}
        {invoices && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}>
                  <th className="p-3 text-left">Criança</th><th className="p-3 text-left">Vencimento</th><th className="p-3 text-left">Total</th><th className="p-3 text-left">Pago</th><th className="p-3 text-left">Status</th><th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b" style={{ borderColor: 'var(--brand-border)' }}>
                    <td className="p-3">{inv.child?.name}</td>
                    <td className="p-3">{new Date(inv.dueDate).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 lk-text-number">{fmt(Number(inv.total))}</td>
                    <td className="p-3 lk-text-number">{fmt(Number(inv.paidAmount))}</td>
                    <td className="p-3">{inv.status}</td>
                    <td className="p-3">
                      {inv.status !== 'PAID' && <button className="btn btn-primary text-sm py-1" onClick={() => { setUiError(''); setPaymentModal({ invoiceId: inv.id, total: Number(inv.total) }); setPaymentAmount(String(inv.total)); }}>Registrar pagamento</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {invoices?.length === 0 && cycle?.id && <p className="p-4 lk-text-muted">Nenhuma fatura. Gere faturas pela API (POST /billing/generate).</p>}
      </div>

      <div className="lk-card">
        <h2 className="font-semibold mb-2">Gastos do mês</h2>
        <p className="lk-text-muted">Total: <span className="lk-text-number">{expenses ? fmt(expenses.reduce((s: number, e: any) => s + Number(e.amount), 0)) : '-'}</span></p>
      </div>

      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
          <div className="lk-card max-w-sm w-full">
            <h2 className="font-semibold mb-4">Registrar pagamento</h2>
            <form onSubmit={(e) => { e.preventDefault(); setUiError(''); payMutation.mutate({ invoiceId: paymentModal.invoiceId, amount: parseFloat(paymentAmount), method: paymentMethod }); }} className="space-y-4">
              {uiError && <p className="text-red-600 text-sm">{uiError}</p>}
              <div><label className="label">Valor</label><input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required /></div>
              <div><label className="label">Forma</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}><option value="PIX">PIX</option><option value="CASH">Dinheiro</option><option value="CARD">Cartão</option><option value="TRANSFER">Transferência</option></select></div>
              <div className="flex gap-2 justify-end"><button type="button" className="btn btn-secondary" onClick={() => setPaymentModal(null)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={payMutation.isPending}>{payMutation.isPending ? 'Registrando...' : 'Registrar'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ title, value, tone }: { title: string; value: string; tone: string }) {
  return (
    <div className="lk-card">
      <p className="text-sm lk-text-muted">{title}</p>
      <p className="text-lg font-semibold lk-text-number" style={{ color: tone }}>{value}</p>
    </div>
  );
}
