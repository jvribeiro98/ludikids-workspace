'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/criancas', label: 'Crianças' },
  { href: '/dashboard/contratos', label: 'Contratos' },
  { href: '/dashboard/financeiro', label: 'Financeiro' },
  { href: '/dashboard/diario', label: 'Painel Diário' },
  { href: '/dashboard/coordenacao', label: 'Inbox Coordenação' },
  { href: '/dashboard/rh', label: 'RH' },
  { href: '/dashboard/whatsapp', label: 'WhatsApp' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-bold text-primary">LudiKids</h2>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm ${
                pathname === item.href
                  ? 'bg-primary/20 text-primary'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-700">
          <button onClick={() => logout().then(() => router.push('/login'))} className="btn btn-secondary w-full text-sm">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
