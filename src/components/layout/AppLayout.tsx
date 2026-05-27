import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface AppLayoutProps {
  children: ReactNode;
}

/** Icono SVG simple inline */
function Icon({ d }: { d: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    to: '/lessons',
    label: 'Lecciones',
    icon: <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  },
  {
    to: '/chat',
    label: 'Chat',
    icon: <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
  },
  {
    to: '/meetings',
    label: 'Reuniones',
    icon: <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    to: '/partner',
    label: 'Mi compañero',
    icon: <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    void navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-brand-gerson/10 text-brand-gerson'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    ].join(' ');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <span className="text-xl font-bold">
            <span className="text-brand-gerson">Gerson</span>
            <span className="mx-1 text-gray-400">vs</span>
            <span className="text-brand-ema">Ema</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-4" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer: perfil + logout */}
        <div className="border-t border-gray-200 p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gerson/20 text-sm font-semibold text-brand-gerson">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{user.display_name}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void handleLogout()}>
            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col">
        {/* Topbar (mobile) */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
          <span className="text-lg font-bold">
            <span className="text-brand-gerson">G</span>
            <span className="text-gray-400">vs</span>
            <span className="text-brand-ema">E</span>
          </span>
          {/* TODO: menú hamburguesa para mobile nav */}
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
