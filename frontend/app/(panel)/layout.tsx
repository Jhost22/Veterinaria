'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ROLE_LABELS, type Role } from '@/lib/types';

const NAV: { href: string; label: string; roles?: Role[] }[] = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/citas', label: 'Citas' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/mascotas', label: 'Mascotas' },
  { href: '/usuarios', label: 'Usuarios', roles: ['ADMIN'] },
];

export default function PanelLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="center-screen">Cargando…</div>;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">🐾 Veterinaria</div>
        <nav className="nav">
          {NAV.filter((n) => !n.roles || n.roles.includes(user.role)).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={pathname.startsWith(n.href) ? 'active' : ''}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>
            <strong>{user.name}</strong>
            {ROLE_LABELS[user.role]}
          </div>
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
          >
            Salir
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
