'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/lib/api';

export default function DiarioPage() {
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const queryClient = useQueryClient();

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiGet<{ id: string; name: string }[]>('/classes'),
  });

  const { data: dailyLog, isLoading } = useQuery({
    queryKey: ['daily-log', classId, date],
    queryFn: () => apiGet<any>(`/daily-logs/class/${classId}?date=${date}`),
    enabled: !!classId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => apiPut(`/daily-logs/items/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily-log'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel diário</h1>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="label">Turma</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="min-w-[180px]"
          >
            <option value="">Selecione</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Data</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {!classId && <p className="text-slate-400">Selecione uma turma.</p>}
      {classId && isLoading && <p className="text-slate-400">Carregando...</p>}
      {classId && dailyLog && (
        <div className="card">
          <h2 className="font-semibold mb-4">Checklist por criança</h2>
          <div className="space-y-4">
            {dailyLog.items?.map((item: any) => (
              <div key={item.id} className="border border-slate-700 rounded-lg p-4">
                <p className="font-medium mb-3">{item.child?.name}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.bath ?? false}
                      onChange={(e) => updateMutation.mutate({ id: item.id, body: { bath: e.target.checked } })}
                    />
                    Banho
                  </label>
                  <div>
                    <span className="text-slate-400">Alimentação:</span>
                    <input
                      className="mt-1"
                      value={item.feeding ?? ''}
                      onChange={(e) => updateMutation.mutate({ id: item.id, body: { feeding: e.target.value } })}
                      placeholder="Ex: mamou bem"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">Sono (min):</span>
                    <input
                      type="number"
                      className="mt-1"
                      value={item.sleepMinutes ?? ''}
                      onChange={(e) => updateMutation.mutate({ id: item.id, body: { sleepMinutes: e.target.value ? parseInt(e.target.value, 10) : undefined } })}
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">Lanche:</span>
                    <input
                      className="mt-1"
                      value={item.snack ?? ''}
                      onChange={(e) => updateMutation.mutate({ id: item.id, body: { snack: e.target.value } })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Observações:</span>
                    <textarea
                      className="mt-1"
                      rows={2}
                      value={item.observations ?? ''}
                      onChange={(e) => updateMutation.mutate({ id: item.id, body: { observations: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
