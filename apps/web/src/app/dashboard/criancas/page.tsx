'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Child { id: string; name: string; birthDate: string | null; class: { id: string; name: string } | null; }

export default function CriancasPage() {
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [classId, setClassId] = useState('');
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  const { data: children, isLoading, isError, refetch } = useQuery({ queryKey: ['children'], queryFn: () => apiGet<Child[]>('/children') });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => apiGet<{ id: string; name: string }[]>('/classes') });

  const createMutation = useMutation({ mutationFn: (body: { name: string; birthDate?: string; classId?: string }) => apiPost('/children', body), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['children'] }); setModal(null); setName(''); setBirthDate(''); setClassId(''); setFormError(''); }, onError: (err: Error) => setFormError(err.message || 'Falha ao criar criança.') });
  const updateMutation = useMutation({ mutationFn: ({ id, body }: { id: string; body: { name: string; birthDate?: string; classId?: string } }) => apiPut(`/children/${id}`, body), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['children'] }); setModal(null); setEditId(null); setFormError(''); }, onError: (err: Error) => setFormError(err.message || 'Falha ao atualizar criança.') });
  const deleteMutation = useMutation({ mutationFn: (id: string) => apiDelete(`/children/${id}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['children'] }), onError: (err: Error) => setFormError(err.message || 'Falha ao excluir criança.') });

  function openEdit(c: Child) { setEditId(c.id); setName(c.name); setBirthDate(c.birthDate ? c.birthDate.slice(0, 10) : ''); setClassId(c.class?.id ?? ''); setFormError(''); setModal('edit'); }

  return (
    <div className="space-y-4">
      <div className="lk-card flex justify-between items-center gap-3 flex-wrap">
        <div><h1 className="text-2xl font-bold">Alunos</h1><p className="lk-text-muted">Cadastro base dos alunos e vinculação de turma.</p></div>
        <button className="btn btn-primary" onClick={() => { setFormError(''); setModal('create'); }}>Novo aluno</button>
      </div>

      {isLoading && <p className="lk-text-muted">Carregando...</p>}
      {isError && <div className="lk-card"><p className="text-red-700 font-medium">Erro ao carregar alunos</p><button className="btn btn-secondary mt-3" onClick={() => refetch()}>Tentar novamente</button></div>}

      {children && children.length > 0 && (
        <div className="lk-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}><th className="p-3 text-left">Nome</th><th className="p-3 text-left">Nascimento</th><th className="p-3 text-left">Turma</th><th className="p-3 w-32" /></tr></thead>
              <tbody>
                {children.map((c) => (
                  <tr key={c.id} className="border-b" style={{ borderColor: 'var(--brand-border)' }}>
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">{c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="p-3">{c.class?.name ?? '-'}</td>
                    <td className="p-3"><button className="text-sm mr-3" style={{ color: 'var(--brand-primary)' }} onClick={() => openEdit(c)}>Editar</button><button className="text-red-600 text-sm" onClick={() => confirm('Excluir aluno?') && deleteMutation.mutate(c.id)}>Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {children?.length === 0 && !isLoading && <div className="lk-card"><p className="lk-text-muted">Nenhum aluno cadastrado ainda.</p></div>}

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
          <div className="lk-card max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Novo aluno' : 'Editar aluno'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); setFormError(''); if (modal === 'create') createMutation.mutate({ name, birthDate: birthDate || undefined, classId: classId || undefined }); else if (editId) updateMutation.mutate({ id: editId, body: { name, birthDate: birthDate || undefined, classId: classId || undefined } }); }} className="space-y-4">
              {formError && <p className="text-red-600 text-sm">{formError}</p>}
              <div><label className="label">Nome</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div><label className="label">Data de nascimento</label><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
              <div><label className="label">Turma</label><select value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">—</option>{classes?.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}</select></div>
              <div className="flex gap-2 justify-end"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>{createMutation.isPending || updateMutation.isPending ? 'Salvando...' : modal === 'create' ? 'Criar' : 'Salvar'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
