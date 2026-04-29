'use client';

import { ChangeEvent, useState } from 'react';
import Image from 'next/image';
import { useBranding } from '@/components/BrandingProvider';
import { BrandingSettings, defaultBranding, isHexColor } from '@/lib/branding';
import { useAuth } from '@/contexts/AuthContext';
import { FULL_ACCESS_ROLES, hasAnyRole } from '@/lib/rbac';

const colorFields: Array<{ key: keyof BrandingSettings['colors']; label: string }> = [
  { key: 'primary', label: 'Primária' },
  { key: 'secondary', label: 'Secundária' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Superfície' },
  { key: 'text', label: 'Texto' },
  { key: 'mutedText', label: 'Texto secundário' },
  { key: 'border', label: 'Bordas' },
];

export default function PersonalizacaoPage() {
  const { user } = useAuth();
  const canAccess = hasAnyRole(user?.roles, FULL_ACCESS_ROLES);
  const { branding, updateBranding, resetBranding } = useBranding();
  const [draft, setDraft] = useState<BrandingSettings>(branding);
  const [error, setError] = useState<string | null>(null);

  const onLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, logoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const save = () => {
    const invalid = colorFields.find(({ key }) => !isHexColor(draft.colors[key]));
    if (invalid) {
      setError(`Cor inválida no campo: ${invalid.label}. Use formato #RRGGBB.`);
      return;
    }
    setError(null);
    updateBranding(draft);
  };

  if (!canAccess) {
    return (
      <div className="lk-card">
        <h1 className="text-2xl font-bold">Personalização (whitelabel)</h1>
        <p className="text-red-700 font-medium mt-2">Você não possui permissão para acessar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="lk-card">
        <h1 className="text-2xl font-bold">Personalização (whitelabel)</h1>
        <p style={{ color: 'var(--brand-muted)' }}>
          Ajuste logo, nome e paleta para cada cliente. Essas configs ficam salvas no navegador para validação de UX e venda.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Nome da marca</label>
              <input value={draft.brandName} onChange={(e) => setDraft({ ...draft, brandName: e.target.value })} />
            </div>
            <div>
              <label className="label">Subtítulo</label>
              <input value={draft.brandSubtitle} onChange={(e) => setDraft({ ...draft, brandSubtitle: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">URL da logo</label>
            <input value={draft.logoUrl} onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })} />
            <p className="text-xs mt-1" style={{ color: 'var(--brand-muted)' }}>Aceita caminho local (/branding/logo.png), URL externa ou upload abaixo.</p>
          </div>

          <div>
            <label className="label">Upload de logo</label>
            <input type="file" accept="image/*" onChange={onLogoUpload} />
          </div>

          <div>
            <p className="font-semibold mb-2">Cores</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {colorFields.map((field) => (
                <div key={field.key} className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={draft.colors[field.key]}
                    onChange={(e) => setDraft({ ...draft, colors: { ...draft.colors, [field.key]: e.target.value } })}
                    className="h-11 w-14 p-1"
                  />
                  <div className="flex-1">
                    <label className="label">{field.label}</label>
                    <input
                      value={draft.colors[field.key]}
                      onChange={(e) => setDraft({ ...draft, colors: { ...draft.colors, [field.key]: e.target.value } })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save}>Salvar personalização</button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDraft(defaultBranding);
                resetBranding();
              }}
            >
              Restaurar padrão Ludikids
            </button>
          </div>
        </div>

        <div className="lk-card">
          <p className="font-semibold mb-3">Preview</p>
          <div className="rounded-2xl p-4" style={{ background: draft.colors.background, border: `1px solid ${draft.colors.border}` }}>
            <div className="rounded-xl p-3" style={{ background: draft.colors.surface }}>
              <Image src={draft.logoUrl} alt={draft.brandName} width={48} height={48} className="w-12 h-12 rounded-xl object-cover mb-2" unoptimized />
              <p className="font-bold" style={{ color: draft.colors.text }}>{draft.brandName}</p>
              <p className="text-xs" style={{ color: draft.colors.mutedText }}>{draft.brandSubtitle}</p>
              <div className="flex gap-2 mt-3">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: draft.colors.primary, color: '#fff' }}>Primária</span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: draft.colors.secondary, color: '#1F2A37' }}>Secundária</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
