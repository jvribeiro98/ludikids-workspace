'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';

export default function CoordenacaoPage() {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['coordination-pending'],
    queryFn: () => apiGet<any[]>('/coordination-inbox/pending'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/coordination-inbox/${id}/approve`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coordination-pending'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/coordination-inbox/${id}/reject`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coordination-pending'] }),
  });

  const contactedMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/coordination-inbox/${id}/contacted`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coordination-pending'] }),
  });

  if (isLoading) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inbox Coordenação</h1>
      <p className="text-slate-400 text-sm">Itens pendentes de revisão/aprovação.</p>

      <div className="space-y-4">
        {items?.length === 0 && <p className="text-slate-400">Nenhum item pendente.</p>}
        {items?.map((item: any) => (
          <div key={item.id} className="card">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <p className="font-medium">{item.child?.name}</p>
                {item.dailyLogItem && (
                  <p className="text-sm text-slate-400 mt-1">
                    Turma: {item.dailyLogItem.dailyLog?.class?.name} · {new Date(item.createdAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary text-sm"
                  onClick={() => approveMutation.mutate(item.id)}
                  disabled={approveMutation.isPending}
                >
                  Aprovar
                </button>
                <button
                  className="btn btn-secondary text-sm"
                  onClick={() => rejectMutation.mutate(item.id)}
                  disabled={rejectMutation.isPending}
                >
                  Rejeitar
                </button>
                <button
                  className="btn btn-secondary text-sm"
                  onClick={() => contactedMutation.mutate(item.id)}
                  disabled={item.contactedGuardian}
                >
                  {item.contactedGuardian ? 'Contatado' : 'Marcar contatado'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
