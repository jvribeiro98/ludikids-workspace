'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ACADEMIC_ROLES, hasAnyRole } from '@/lib/rbac';

export default function DiarioPage() {
  const { user } = useAuth();
  const canAccess = hasAnyRole(user?.roles, ACADEMIC_ROLES);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const queryClient = useQueryClient();

  const { data: classes, isLoading: classesLoading, isError: classesError, refetch: refetchClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiGet<{ id: string; name: string }[]>('/classes'),
  });

  const { data: dailyLog, isLoading, isError, refetch } = useQuery({
    queryKey: ['daily-log', classId, date],
    queryFn: () => apiGet<any>(`/daily-logs/class/${classId}?date=${date}`),
    enabled: !!classId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => apiPut(`/daily-logs/items/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily-log'] }),
  });

  if (!canAccess) {
    return (
      <div className="lk-card">
        <h1 className="text-2xl font-bold">Painel diário</h1>
        <p className="text-red-700 font-medium mt-2">Você não possui permissão para acessar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="lk-card">
        <h1 className="text-2xl font-bold">Painel diário</h1>
        <p className="lk-text-muted">Controle de banho, alimentação, sono e observações por criança.</p>
      </div>

      <div className="lk-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Turma</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Selecione</option>{classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div>
            <label className="label">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex items-end"><button className="btn btn-secondary w-full" onClick={() => classId && refetch()} disabled={!classId}>Atualizar diário</button></div>
        </div>

        {classesLoading && <p className="text-sm mt-3 lk-text-muted">Carregando turmas...</p>}
        {classesError && <div className="mt-3 lk-card-soft p-3"><p className="text-sm text-red-700">Erro ao carregar turmas.</p><button className="btn btn-secondary mt-2" onClick={() => refetchClasses()}>Tentar novamente</button></div>}
      </div>

      {!classId && <div className="lk-card"><p className="lk-text-muted">Selecione uma turma para visualizar os lançamentos do dia.</p></div>}
      {classId && isLoading && <div className="lk-card"><p className="lk-text-muted">Carregando diário...</p></div>}
      {classId && isError && <div className="lk-card"><p className="text-red-700 text-sm">Erro ao carregar checklist diário.</p><button className="btn btn-secondary mt-2" onClick={() => refetch()}>Tentar novamente</button></div>}

      {classId && dailyLog && (
        <div className="lk-card">
          <h2 className="font-semibold mb-4">Checklist por criança</h2>
          <div className="space-y-4">
            {dailyLog.items?.length === 0 && <p className="lk-text-muted">Nenhum item de diário para esta turma/data.</p>}
            {dailyLog.items?.map((item: any) => (
              <div key={item.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--brand-border)' }}>
                <p className="font-medium mb-3">{item.child?.name}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={item.bath ?? false} onChange={(e) => updateMutation.mutate({ id: item.id, body: { bath: e.target.checked } })} />Banho</label>
                  <div><span className="lk-text-muted">Alimentação:</span><input className="mt-1" value={item.feeding ?? ''} onChange={(e) => updateMutation.mutate({ id: item.id, body: { feeding: e.target.value } })} placeholder="Ex: mamou bem" /></div>
                  <div><span className="lk-text-muted">Sono (min):</span><input type="number" className="mt-1" value={item.sleepMinutes ?? ''} onChange={(e) => updateMutation.mutate({ id: item.id, body: { sleepMinutes: e.target.value ? parseInt(e.target.value, 10) : undefined } })} /></div>
                  <div><span className="lk-text-muted">Lanche:</span><input className="mt-1" value={item.snack ?? ''} onChange={(e) => updateMutation.mutate({ id: item.id, body: { snack: e.target.value } })} /></div>
                  <div className="sm:col-span-2"><span className="lk-text-muted">Observações:</span><textarea className="mt-1" rows={2} value={item.observations ?? ''} onChange={(e) => updateMutation.mutate({ id: item.id, body: { observations: e.target.value } })} /></div>
                </div>
              </div>
            ))}
          </div>
          {updateMutation.isPending && <p className="text-xs mt-3 lk-text-muted">Salvando alterações...</p>}
        </div>
      )}
    </div>
  );
}
