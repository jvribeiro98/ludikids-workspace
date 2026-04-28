'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';

export default function CoordenacaoPage() {
  const queryClient = useQueryClient();

  const { data: items, isLoading, isError, refetch } = useQuery({
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

  return (
    <div className="space-y-4">
      <div className="lk-card">
        <h1 className="text-2xl font-bold">Inbox da Coordenação</h1>
        <p className="lk-text-muted">Aprovação de ocorrências e acompanhamento de contato com responsáveis.</p>
      </div>

      {isLoading && <div className="lk-card"><p className="lk-text-muted">Carregando pendências...</p></div>}

      {isError && (
        <div className="lk-card">
          <p className="text-red-700 text-sm">Erro ao carregar pendências.</p>
          <button className="btn btn-secondary mt-2" onClick={() => refetch()}>Tentar novamente</button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {items?.length === 0 && (
            <div className="lk-card"><p className="lk-text-muted">Nenhum item pendente. Inbox limpa.</p></div>
          )}

          {items?.map((item: any) => (
            <div key={item.id} className="lk-card">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <p className="font-semibold">{item.child?.name}</p>
                  {item.dailyLogItem && (
                    <p className="text-sm mt-1 lk-text-muted">
                      Turma: {item.dailyLogItem.dailyLog?.class?.name} · {new Date(item.createdAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-primary text-sm" onClick={() => approveMutation.mutate(item.id)} disabled={approveMutation.isPending || rejectMutation.isPending}>Aprovar</button>
                  <button className="btn btn-secondary text-sm" onClick={() => rejectMutation.mutate(item.id)} disabled={approveMutation.isPending || rejectMutation.isPending}>Rejeitar</button>
                  <button className="btn text-sm" style={{ background: 'color-mix(in srgb, var(--brand-accent) 18%, white)' }} onClick={() => contactedMutation.mutate(item.id)} disabled={item.contactedGuardian || contactedMutation.isPending}>
                    {item.contactedGuardian ? 'Contatado' : 'Marcar contatado'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
