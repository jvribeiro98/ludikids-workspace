'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Child {
  id: string;
  name: string;
  birthDate: string | null;
  class: { id: string; name: string } | null;
}

export default function CriancasPage() {
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [classId, setClassId] = useState('');
  const queryClient = useQueryClient();

  const { data: children, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: () => apiGet<Child[]>('/children'),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiGet<{ id: string; name: string }[]>('/classes'),
  });

  const createMutation = useMutation({
    mutationFn: (body: { name: string; birthDate?: string; classId?: string }) =>
      apiPost('/children', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      setModal(null);
      setName('');
      setBirthDate('');
      setClassId('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string; birthDate?: string; classId?: string } }) =>
      apiPut(`/children/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      setModal(null);
      setEditId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/children/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['children'] }),
  });

  function openEdit(c: Child) {
    setEditId(c.id);
    setName(c.name);
    setBirthDate(c.birthDate ? c.birthDate.slice(0, 10) : '');
    setClassId(c.class?.id ?? '');
    setModal('edit');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Crianças</h1>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          Nova criança
        </button>
      </div>

      {isLoading && <p className="text-slate-400">Carregando...</p>}
      {children && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left text-sm text-slate-400">
                <th className="p-3">Nome</th>
                <th className="p-3">Nascimento</th>
                <th className="p-3">Turma</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {children.map((c) => (
                <tr key={c.id} className="border-b border-slate-700/50">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="p-3">{c.class?.name ?? '-'}</td>
                  <td className="p-3">
                    <button className="text-primary text-sm mr-2" onClick={() => openEdit(c)}>Editar</button>
                    <button className="text-red-400 text-sm" onClick={() => confirm('Excluir?') && deleteMutation.mutate(c.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Nova criança' : 'Editar criança'}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (modal === 'create') {
                  createMutation.mutate({ name, birthDate: birthDate || undefined, classId: classId || undefined });
                } else if (editId) {
                  updateMutation.mutate({ id: editId, body: { name, birthDate: birthDate || undefined, classId: classId || undefined } });
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="label">Nome</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Data de nascimento</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Turma</label>
                <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value="">—</option>
                  {classes?.map((cl) => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {modal === 'create' ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
