import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: 'LudiKids - Gestão de Creche',
  description: 'Sistema de gestão para creche LudiKids',
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
