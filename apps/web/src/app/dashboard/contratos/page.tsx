'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

interface Contract {
  id: string;
  startDate: string;
  endDate: string | null;
  dueDay: number;
  child: { name: string };
  contractServices: { service: { name: string }; unitPrice: string }[];
}

export default function ContratosPage() {
  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => apiGet<Contract[]>('/contracts'),
  });

  if (isLoading) return <p className="text-slate-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Contratos</h1>
      <p className="text-slate-400 text-sm">Lista de contratos ativos. Crie contratos pela API ou expanda esta tela com formulário de criação.</p>
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 text-left text-sm text-slate-400">
              <th className="p-3">Criança</th>
              <th className="p-3">Início</th>
              <th className="p-3">Vencimento (dia)</th>
              <th className="p-3">Serviços</th>
            </tr>
          </thead>
          <tbody>
            {contracts?.map((c) => (
              <tr key={c.id} className="border-b border-slate-700/50">
                <td className="p-3">{c.child.name}</td>
                <td className="p-3">{new Date(c.startDate).toLocaleDateString('pt-BR')}</td>
                <td className="p-3">{c.dueDay}</td>
                <td className="p-3">
                  {c.contractServices.map((cs) => `${cs.service.name} (R$ ${cs.unitPrice})`).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contracts?.length === 0 && <p className="p-4 text-slate-400">Nenhum contrato cadastrado.</p>}
      </div>
    </div>
  );
}
