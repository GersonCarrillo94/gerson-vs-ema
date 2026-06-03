import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { useUnreadCount, useRealtimeUnreadBadge } from '@/features/chat/hooks/useMessages';
import { usePendingMeetingsCount, useRealtimePendingBadge } from '@/features/meetings/hooks/useMeetings';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface AppLayoutProps {
  children: ReactNode;
}

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

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 18.364l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
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
  {
    to: '/settings',
    label: 'Configuración',
    icon: <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  },
];

function NavBadge({ to, unreadCount, pendingMeetings }: { to: string; unreadCount: number; pendingMeetings: number }) {
  if (to === '/chat' && unreadCount > 0) {
    return (
      <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    );
  }
  if (to === '/meetings' && pendingMeetings > 0) {
    return <span className="ml-auto h-2.5 w-2.5 rounded-full bg-red-500" />;
  }
  return null;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: pendingMeetings = 0 } = usePendingMeetingsCount();
  const { isDark, toggleTheme } = useTheme();
  useRealtimeUnreadBadge();
  useRealtimePendingBadge();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-brand-gerson/10 text-brand-gerson dark:bg-brand-gerson/20'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
    ].join(' ');

  const hasAnyBadge = unreadCount > 0 || pendingMeetings > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:flex">
        <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-700 px-6">
          <span className="text-xl font-bold">
            <span className="text-brand-gerson">Gerson</span>
            <span className="mx-1 text-gray-400 dark:text-gray-500">vs</span>
            <span className="text-brand-ema">Ema</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <NavBadge to={item.to} unreadCount={unreadCount} pendingMeetings={pendingMeetings} />
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gerson/20 text-sm font-semibold text-brand-gerson">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.display_name}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="flex-1 justify-start" onClick={() => { void handleLogout(); }}>
              <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              Cerrar sesión
            </Button>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </aside>

      {/* ── Mobile drawer + backdrop ── */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={[
            'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          ].join(' ')}
          aria-hidden="true"
          onClick={() => { setMobileOpen(false); }}
        />

        {/* Drawer panel */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
          aria-label="Navegación móvil"
          role="dialog"
          aria-modal="true"
        >
          {/* Drawer header */}
          <div className="flex h-14 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4">
            <span className="text-lg font-bold">
              <span className="text-brand-gerson">Gerson</span>
              <span className="mx-1 text-gray-400 dark:text-gray-500">vs</span>
              <span className="text-brand-ema">Ema</span>
            </span>
            <button
              onClick={() => { setMobileOpen(false); }}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
              aria-label="Cerrar menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={navLinkClass}
                onClick={() => { setMobileOpen(false); }}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                <NavBadge to={item.to} unreadCount={unreadCount} pendingMeetings={pendingMeetings} />
              </NavLink>
            ))}
          </nav>

          {/* Drawer footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {user && (
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gerson/20 text-sm font-semibold text-brand-gerson">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.display_name}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="flex-1 justify-start" onClick={() => { void handleLogout(); }}>
                <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                Cerrar sesión
              </Button>
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            </div>
          </div>
        </aside>
      </div>

      {/* ── Contenido principal ── */}
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        {/* Topbar (mobile only) */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:hidden shrink-0">
          <span className="text-lg font-bold">
            <span className="text-brand-gerson">G</span>
            <span className="text-gray-400 dark:text-gray-500">vs</span>
            <span className="text-brand-ema">E</span>
          </span>

          <div className="flex items-center gap-1">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

            {/* Hamburger button */}
            <button
              onClick={() => { setMobileOpen(true); }}
              className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {hasAnyBadge && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 min-h-0">{children}</main>
      </div>
    </div>
  );
}
