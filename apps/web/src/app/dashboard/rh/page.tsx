'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

export default function RHPage() {
  const [staffId, setStaffId] = useState('');
  const [punchType, setPunchType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [geo, setGeo] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: staffList, isLoading, isError, refetch } = useQuery({ queryKey: ['hr-staff'], queryFn: () => apiGet<{ id: string; name: string }[]>('/hr/staff') });

  const punchMutation = useMutation({
    mutationFn: (body: { staffProfileId: string; type: string; latitude?: number; longitude?: number; accuracy?: number }) => apiPost('/hr/punch', body),
    onSuccess: () => { setUiError(null); queryClient.invalidateQueries({ queryKey: ['hr-staff'] }); },
    onError: () => setUiError('Falha ao registrar ponto. Verifique os dados e tente novamente.'),
  });

  function requestLocation() {
    if (!navigator.geolocation) return setUiError('Geolocalização não suportada neste navegador.');
    navigator.geolocation.getCurrentPosition((pos) => { setUiError(null); setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); }, () => setUiError('Não foi possível obter a localização.'));
  }

  function handlePunch(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId) return;
    punchMutation.mutate({ staffProfileId: staffId, type: punchType, latitude: geo?.lat, longitude: geo?.lng, accuracy: geo?.accuracy });
  }

  return (
    <div className="space-y-4">
      <div className="lk-card"><h1 className="text-2xl font-bold">RH</h1><p className="lk-text-muted">Registro de ponto com geolocalização para validação de presença.</p></div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="lk-card xl:col-span-2">
          <h2 className="font-semibold mb-1">Bater ponto</h2>
          <p className="text-sm mb-4 lk-text-muted">A localização é coletada no momento do registro para validar geofence.</p>

          <form onSubmit={handlePunch} className="space-y-4 max-w-xl">
            <div><label className="label">Funcionário</label><select value={staffId} onChange={(e) => setStaffId(e.target.value)} required><option value="">Selecione</option>{staffList?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="label">Tipo</label><select value={punchType} onChange={(e) => setPunchType(e.target.value as any)}><option value="ENTRY">Entrada</option><option value="EXIT">Saída</option></select></div>
            <div className="flex flex-wrap gap-2 items-center"><button type="button" className="btn btn-secondary" onClick={requestLocation}>Obter localização atual</button>{geo && <p className="text-xs lk-text-muted">Lat: {geo.lat.toFixed(5)} · Long: {geo.lng.toFixed(5)}</p>}</div>
            <button type="submit" className="btn btn-primary" disabled={punchMutation.isPending}>{punchMutation.isPending ? 'Registrando...' : 'Registrar ponto'}</button>
          </form>

          {uiError && <p className="text-red-600 text-sm mt-3">{uiError}</p>}
          {punchMutation.isSuccess && <p className="text-green-600 text-sm mt-3">Ponto registrado com sucesso.</p>}
        </div>

        <div className="lk-card">
          <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Funcionários</h2><button className="btn btn-secondary text-sm" onClick={() => refetch()}>Atualizar</button></div>
          {isLoading && <p className="lk-text-muted">Carregando...</p>}
          {isError && <p className="text-red-600 text-sm">Erro ao carregar funcionários.</p>}
          {!isLoading && !isError && (staffList?.length ?? 0) === 0 && <p className="lk-text-muted">Nenhum funcionário cadastrado.</p>}
          <ul className="space-y-2 text-sm">{staffList?.map((s) => <li key={s.id} className="rounded-lg px-3 py-2" style={{ background: 'color-mix(in srgb, var(--brand-primary) 8%, white)' }}>{s.name}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
