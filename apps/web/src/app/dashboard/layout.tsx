'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/components/BrandingProvider';
import { FINANCIAL_ROLES, hasAnyRole, MANAGEMENT_ROLES, ACADEMIC_ROLES, FULL_ACCESS_ROLES } from '@/lib/rbac';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dashboard/criancas', label: 'Alunos', icon: '🧒' },
  { href: '/dashboard/contratos', label: 'Contratos', icon: '📄' },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: '💰' },
  { href: '/dashboard/diario', label: 'Diário', icon: '📘' },
  { href: '/dashboard/coordenacao', label: 'Coordenação', icon: '🎯' },
  { href: '/dashboard/rh', label: 'RH', icon: '👥' },
  { href: '/dashboard/whatsapp', label: 'Comunicação', icon: '💬' },
  { href: '/dashboard/personalizacao', label: 'Personalização', icon: '🎨' },
];

const mobileTabs = nav.slice(0, 5);

function canAccessNav(href: string, userRoles: string[]) {
  if (href === '/dashboard/financeiro') return hasAnyRole(userRoles, FINANCIAL_ROLES);
  if (href === '/dashboard/rh' || href === '/dashboard/coordenacao' || href === '/dashboard/whatsapp') {
    return hasAnyRole(userRoles, MANAGEMENT_ROLES);
  }
  if (href === '/dashboard/criancas' || href === '/dashboard/contratos' || href === '/dashboard/diario') {
    return hasAnyRole(userRoles, ACADEMIC_ROLES);
  }
  if (href === '/dashboard/personalizacao') return hasAnyRole(userRoles, FULL_ACCESS_ROLES);
  return true;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const { branding } = useBranding();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p style={{ color: 'var(--brand-muted)' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 lg:p-5" style={{ background: 'linear-gradient(160deg, var(--brand-primary), #1e1b4b)' }}>
      <div className="min-h-[calc(100vh-1.5rem)] rounded-[28px] p-3 lg:p-5" style={{ background: 'var(--brand-bg)' }}>
        <div className="lg:hidden mb-3 flex items-center justify-between lk-card">
          <div className="flex items-center gap-2 min-w-0">
            <Image src={branding.logoUrl} alt={branding.brandName} width={36} height={36} className="h-9 w-9 rounded-xl object-cover border" style={{ borderColor: 'var(--brand-border)' }} unoptimized />
            <p className="font-semibold leading-none text-base truncate">{branding.brandName}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>Menu</button>
        </div>

        <div className="flex gap-4">
          <aside className={`${open ? 'fixed inset-0 z-30 flex' : 'hidden'} lg:relative lg:flex lg:w-72 shrink-0`} aria-label="Menu lateral">
            {open && <button className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
            <div className="relative z-10 w-72 lg:w-full lk-card p-4 flex flex-col">
              <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--brand-border)' }}>
                <Image src={branding.logoUrl} alt={branding.brandName} width={44} height={44} className="h-11 w-11 rounded-xl object-cover border" style={{ borderColor: 'var(--brand-border)' }} unoptimized />
                <div className="min-w-0">
                  <p className="font-semibold truncate text-[17px]">{branding.brandName}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--brand-muted)' }}>ERP escolar multi-tenant</p>
                </div>
              </div>

              <nav className="flex-1 mt-4 space-y-1 overflow-y-auto">
                {nav.filter((item) => canAccessNav(item.href, user.roles)).map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 rounded-xl text-sm font-medium"
                      style={{
                        background: active ? 'color-mix(in srgb, var(--brand-primary) 16%, white)' : 'transparent',
                        color: active ? 'var(--brand-primary)' : 'var(--brand-text)',
                      }}
                    >
                      <span className="mr-2">{item.icon}</span>{item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t" style={{ borderColor: 'var(--brand-border)' }}>
                <p className="text-xs mb-2 truncate" style={{ color: 'var(--brand-muted)' }}>{user.email}</p>
                <button onClick={() => logout().then(() => router.push('/login'))} className="btn btn-secondary w-full text-sm">Sair</button>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0 space-y-3">
            {children}
            <div className="lg:hidden">
              <nav className="lk-mobile-tabbar" aria-label="Ações rápidas mobile">
                {mobileTabs.filter((item) => canAccessNav(item.href, user.roles)).map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} className={`lk-mobile-tab ${active ? 'active' : ''}`}>
                      <div>{item.icon}</div>
                      <div>{item.label}</div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
