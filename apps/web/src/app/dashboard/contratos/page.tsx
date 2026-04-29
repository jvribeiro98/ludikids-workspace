'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ACADEMIC_ROLES, hasAnyRole } from '@/lib/rbac';

interface Contract {
  id: string;
  startDate: string;
  endDate: string | null;
  dueDay: number;
  child: { name: string };
  contractServices: { service: { name: string }; unitPrice: string }[];
}

export default function ContratosPage() {
  const { user } = useAuth();
  const canAccess = hasAnyRole(user?.roles, ACADEMIC_ROLES);
  const { data: contracts, isLoading, isError, refetch } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => apiGet<Contract[]>('/contracts'),
  });

  if (!canAccess) {
    return (
      <div className="lk-card">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <p className="text-red-700 font-medium mt-2">Você não possui permissão para acessar este módulo.</p>
      </div>
    );
  }

  if (isLoading) return <p className="lk-text-muted">Carregando contratos...</p>;

  if (isError) {
    return (
      <div className="lk-card">
        <h1 className="text-2xl font-bold mb-2">Contratos</h1>
        <p className="text-red-600">Não foi possível carregar os contratos.</p>
        <button className="btn btn-secondary mt-3" onClick={() => refetch()}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="lk-card">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <p className="lk-text-muted">Visão de contratos ativos, vencimento e composição de serviços.</p>
      </div>

      <div className="lk-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-muted)' }}>
                <th className="p-3 text-left">Criança</th>
                <th className="p-3 text-left">Início</th>
                <th className="p-3 text-left">Vencimento (dia)</th>
                <th className="p-3 text-left">Serviços</th>
              </tr>
            </thead>
            <tbody>
              {contracts?.map((c) => (
                <tr key={c.id} className="border-b" style={{ borderColor: 'var(--brand-border)' }}>
                  <td className="p-3 font-medium">{c.child.name}</td>
                  <td className="p-3">{new Date(c.startDate).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3">{c.dueDay}</td>
                  <td className="p-3">{c.contractServices.map((cs) => `${cs.service.name} (R$ ${cs.unitPrice})`).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {contracts?.length === 0 && <p className="p-4 lk-text-muted">Nenhum contrato cadastrado.</p>}
      </div>
    </div>
  );
}
