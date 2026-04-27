import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: 'LudiKids - Gestão de Creche',
  description: 'Sistema de gestão para creche LudiKids',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
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
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
