import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/components/QueryProvider';
import { BrandingProvider } from '@/components/BrandingProvider';

export const metadata: Metadata = {
  title: 'LudiKids - Gestão Escolar',
  description: 'Sistema de gestão escolar com módulo financeiro e personalização visual por cliente.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#4F46E5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isGithubPages = process.env.GITHUB_PAGES === 'true';

  return (
    <html lang="pt-BR">
      <body>
        {!isGithubPages && <Script src="/runtime-config.js" strategy="beforeInteractive" />}
        <QueryProvider>
          <BrandingProvider>
            <AuthProvider>{children}</AuthProvider>
          </BrandingProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
