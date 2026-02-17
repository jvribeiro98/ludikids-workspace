'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

export default function WhatsAppPage() {
  const [tab, setTab] = useState<'templates' | 'rules' | 'outbox'>('outbox');
  const queryClient = useQueryClient();

  const { data: templates } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => apiGet<any[]>('/whatsapp/templates'),
  });

  const { data: rules } = useQuery({
    queryKey: ['whatsapp-rules'],
    queryFn: () => apiGet<any[]>('/whatsapp/rules'),
  });

  const { data: outbox } = useQuery({
    queryKey: ['whatsapp-outbox'],
    queryFn: () => apiGet<any[]>('/whatsapp/outbox'),
  });

  const processMutation = useMutation({
    mutationFn: () => apiPost('/whatsapp/process-rules', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-outbox'] }),
  });

  const sendStubMutation = useMutation({
    mutationFn: () => apiPost('/whatsapp/send-queued-stub', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-outbox'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">WhatsApp</h1>
      <p className="text-slate-400 text-sm">Templates, regras e fila de envio (MVP: envio é stub).</p>

      <div className="flex gap-2">
        <button
          className={`btn ${tab === 'templates' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('templates')}
        >
          Templates
        </button>
        <button
          className={`btn ${tab === 'rules' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('rules')}
        >
          Regras
        </button>
        <button
          className={`btn ${tab === 'outbox' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('outbox')}
        >
          Outbox
        </button>
      </div>

      {tab === 'templates' && (
        <div className="card">
          <h2 className="font-semibold mb-3">Templates</h2>
          <ul className="space-y-2">
            {templates?.map((t: any) => (
              <li key={t.id} className="border-b border-slate-700/50 pb-2">
                <span className="font-medium">{t.code}</span> — {t.name}
                <p className="text-sm text-slate-400 mt-1">{t.body?.slice(0, 80)}...</p>
              </li>
            ))}
            {templates?.length === 0 && <p className="text-slate-400">Nenhum template. Crie pela API.</p>}
          </ul>
        </div>
      )}

      {tab === 'rules' && (
        <div className="card">
          <h2 className="font-semibold mb-3">Regras (D-2, D0, D+10, OVERDUE)</h2>
          <ul className="space-y-2">
            {rules?.map((r: any) => (
              <li key={r.id}>{r.trigger} — {r.active ? 'Ativa' : 'Inativa'} — Template: {r.template?.name ?? '-'}</li>
            ))}
            {rules?.length === 0 && <p className="text-slate-400">Nenhuma regra.</p>}
          </ul>
        </div>
      )}

      {tab === 'outbox' && (
        <div className="card">
          <div className="flex gap-2 mb-4">
            <button
              className="btn btn-primary"
              onClick={() => processMutation.mutate()}
              disabled={processMutation.isPending}
            >
              Processar regras (gerar outbox)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => sendStubMutation.mutate()}
              disabled={sendStubMutation.isPending}
            >
              Enviar fila (stub)
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="p-2">Telefone</th>
                <th className="p-2">Status</th>
                <th className="p-2">Criado</th>
              </tr>
            </thead>
            <tbody>
              {outbox?.map((o: any) => (
                <tr key={o.id} className="border-b border-slate-700/50">
                  <td className="p-2">{o.phone}</td>
                  <td className="p-2">{o.status}</td>
                  <td className="p-2">{new Date(o.createdAt).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {outbox?.length === 0 && <p className="text-slate-400 py-4">Nenhum item na fila.</p>}
        </div>
      )}
    </div>
  );
}
