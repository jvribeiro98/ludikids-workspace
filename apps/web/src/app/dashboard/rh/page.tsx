'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

export default function RHPage() {
  const [staffId, setStaffId] = useState('');
  const [punchType, setPunchType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [geo, setGeo] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const queryClient = useQueryClient();

  const { data: staffList } = useQuery({
    queryKey: ['hr-staff'],
    queryFn: () => apiGet<{ id: string; name: string }[]>('/hr/staff'),
  });

  const punchMutation = useMutation({
    mutationFn: (body: { staffProfileId: string; type: string; latitude?: number; longitude?: number; accuracy?: number }) =>
      apiPost('/hr/punch', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-staff'] }),
  });

  function requestLocation() {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada neste navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => alert('Não foi possível obter a localização.')
    );
  }

  function handlePunch(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId) return;
    punchMutation.mutate({
      staffProfileId: staffId,
      type: punchType,
      latitude: geo?.lat,
      longitude: geo?.lng,
      accuracy: geo?.accuracy,
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">RH</h1>

      <div className="card max-w-md">
        <h2 className="font-semibold mb-4">Bater ponto</h2>
        <p className="text-slate-400 text-sm mb-4">A localização é coletada no momento do registro para validar geofence.</p>
        <form onSubmit={handlePunch} className="space-y-4">
          <div>
            <label className="label">Funcionário</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} required>
              <option value="">Selecione</option>
              {staffList?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select value={punchType} onChange={(e) => setPunchType(e.target.value as any)}>
              <option value="ENTRY">Entrada</option>
              <option value="EXIT">Saída</option>
            </select>
          </div>
          <div>
            <button type="button" className="btn btn-secondary mb-2" onClick={requestLocation}>
              Obter localização atual
            </button>
            {geo && <p className="text-xs text-slate-400">Lat: {geo.lat.toFixed(5)} · Long: {geo.lng.toFixed(5)}</p>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={punchMutation.isPending}>
            Registrar ponto
          </button>
        </form>
        {punchMutation.isSuccess && <p className="text-green-400 text-sm mt-2">Ponto registrado.</p>}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Funcionários</h2>
        {staffList?.length === 0 && <p className="text-slate-400">Nenhum funcionário cadastrado. Use a API (POST /hr/staff) para cadastrar.</p>}
        <ul className="space-y-2">
          {staffList?.map((s) => (
            <li key={s.id}>{s.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
