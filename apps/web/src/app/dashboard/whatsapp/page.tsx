'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

export default function WhatsAppPage() {
  const [tab, setTab] = useState<'templates' | 'rules' | 'outbox'>('outbox');
  const queryClient = useQueryClient();

  const { data: templates, isLoading: loadingTemplates, isError: errTemplates } = useQuery({ queryKey: ['whatsapp-templates'], queryFn: () => apiGet<any[]>('/whatsapp/templates') });
  const { data: rules, isLoading: loadingRules, isError: errRules } = useQuery({ queryKey: ['whatsapp-rules'], queryFn: () => apiGet<any[]>('/whatsapp/rules') });
  const { data: outbox, isLoading: loadingOutbox, isError: errOutbox } = useQuery({ queryKey: ['whatsapp-outbox'], queryFn: () => apiGet<any[]>('/whatsapp/outbox') });

  const processMutation = useMutation({ mutationFn: () => apiPost('/whatsapp/process-rules', {}), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-outbox'] }) });
  const sendStubMutation = useMutation({ mutationFn: () => apiPost('/whatsapp/send-queued-stub', {}), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-outbox'] }) });

  return (
    <div className="space-y-4">
      <div className="lk-card"><h1 className="text-2xl font-bold">Comunicação (WhatsApp)</h1><p className="lk-text-muted">Templates, regras de disparo e fila de envio. No MVP o envio é simulado (stub).</p></div>

      <div className="lk-card flex flex-wrap gap-2">
        <button className={`btn ${tab === 'templates' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('templates')}>Templates</button>
        <button className={`btn ${tab === 'rules' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('rules')}>Regras</button>
        <button className={`btn ${tab === 'outbox' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('outbox')}>Outbox</button>
      </div>

      {tab === 'templates' && <div className="lk-card"><h2 className="font-semibold mb-3">Templates</h2>{loadingTemplates && <p className="lk-text-muted">Carregando templates...</p>}{errTemplates && <p className="text-red-600 text-sm">Erro ao carregar templates.</p>}{!loadingTemplates && !errTemplates && <ul className="space-y-2">{templates?.map((t: any) => <li key={t.id} className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--brand-primary) 8%, white)' }}><span className="font-medium">{t.code}</span> — {t.name}<p className="text-sm mt-1 lk-text-muted">{t.body?.slice(0, 100)}...</p></li>)}{templates?.length === 0 && <p className="lk-text-muted">Nenhum template cadastrado.</p>}</ul>}</div>}

      {tab === 'rules' && <div className="lk-card"><h2 className="font-semibold mb-3">Regras (D-2, D0, D+10, OVERDUE)</h2>{loadingRules && <p className="lk-text-muted">Carregando regras...</p>}{errRules && <p className="text-red-600 text-sm">Erro ao carregar regras.</p>}{!loadingRules && !errRules && <ul className="space-y-2 text-sm">{rules?.map((r: any) => <li key={r.id} className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--brand-secondary) 22%, white)' }}><strong>{r.trigger}</strong> — {r.active ? 'Ativa' : 'Inativa'} — Template: {r.template?.name ?? '-'}</li>)}{rules?.length === 0 && <p className="lk-text-muted">Nenhuma regra cadastrada.</p>}</ul>}</div>}

      {tab === 'outbox' && (
        <div className="lk-card">
          <div className="flex flex-wrap gap-2 mb-4">
            <button className="btn btn-primary" onClick={() => processMutation.mutate()} disabled={processMutation.isPending}>{processMutation.isPending ? 'Processando...' : 'Processar regras'}</button>
            <button className="btn btn-secondary" onClick={() => sendStubMutation.mutate()} disabled={sendStubMutation.isPending}>{sendStubMutation.isPending ? 'Enviando...' : 'Enviar fila (stub)'}</button>
          </div>

          {loadingOutbox && <p className="lk-text-muted">Carregando outbox...</p>}
          {errOutbox && <p className="text-red-600 text-sm">Erro ao carregar outbox.</p>}

          {!loadingOutbox && !errOutbox && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}><th className="p-2 text-left">Telefone</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Criado</th></tr></thead>
                <tbody>{outbox?.map((o: any) => <tr key={o.id} className="border-b" style={{ borderColor: 'var(--brand-border)' }}><td className="p-2">{o.phone}</td><td className="p-2">{o.status}</td><td className="p-2">{new Date(o.createdAt).toLocaleString('pt-BR')}</td></tr>)}</tbody>
              </table>
              {outbox?.length === 0 && <p className="py-4 lk-text-muted">Nenhum item na fila.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
