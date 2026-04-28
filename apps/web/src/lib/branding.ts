export type BrandingSettings = {
  brandName: string;
  brandSubtitle: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    border: string;
  };
};

export const BRANDING_STORAGE_KEY = 'ludikids-branding-settings';

export const defaultBranding: BrandingSettings = {
  brandName: 'LudiKids',
  brandSubtitle: 'ERP Escolar Inteligente',
  logoUrl: '/branding/ludikids-logo-wide.jpg',
  colors: {
    primary: '#4F46E5',
    secondary: '#06B6D4',
    accent: '#8B5CF6',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    mutedText: '#64748B',
    border: '#E2E8F0',
  },
};

export function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function sanitizeBranding(input: Partial<BrandingSettings> | null | undefined): BrandingSettings {
  if (!input) return defaultBranding;

  const colors = { ...defaultBranding.colors, ...(input.colors || {}) };

  (Object.keys(defaultBranding.colors) as Array<keyof BrandingSettings['colors']>).forEach((key) => {
    if (!isHexColor(colors[key])) colors[key] = defaultBranding.colors[key];
  });

  return {
    brandName: input.brandName?.trim() || defaultBranding.brandName,
    brandSubtitle: input.brandSubtitle?.trim() || defaultBranding.brandSubtitle,
    logoUrl: input.logoUrl?.trim() || defaultBranding.logoUrl,
    colors,
  };
}
