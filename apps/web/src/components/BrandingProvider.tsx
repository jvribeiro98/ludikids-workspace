'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BRANDING_STORAGE_KEY, BrandingSettings, defaultBranding, sanitizeBranding } from '@/lib/branding';

type BrandingContextValue = {
  branding: BrandingSettings;
  updateBranding: (next: BrandingSettings) => void;
  resetBranding: () => void;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

function applyBrandingToDocument(branding: BrandingSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.style.setProperty('--brand-primary', branding.colors.primary);
  root.style.setProperty('--brand-secondary', branding.colors.secondary);
  root.style.setProperty('--brand-accent', branding.colors.accent);
  root.style.setProperty('--brand-bg', branding.colors.background);
  root.style.setProperty('--brand-surface', branding.colors.surface);
  root.style.setProperty('--brand-text', branding.colors.text);
  root.style.setProperty('--brand-muted', branding.colors.mutedText);
  root.style.setProperty('--brand-border', branding.colors.border);
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);

  useEffect(() => {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
    const parsed = raw ? sanitizeBranding(JSON.parse(raw) as BrandingSettings) : defaultBranding;
    setBranding(parsed);
    applyBrandingToDocument(parsed);
  }, []);

  const value = useMemo<BrandingContextValue>(
    () => ({
      branding,
      updateBranding: (next) => {
        const sanitized = sanitizeBranding(next);
        setBranding(sanitized);
        localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(sanitized));
        applyBrandingToDocument(sanitized);
      },
      resetBranding: () => {
        setBranding(defaultBranding);
        localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(defaultBranding));
        applyBrandingToDocument(defaultBranding);
      },
    }),
    [branding],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used inside BrandingProvider');
  return ctx;
}
