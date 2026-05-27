import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Envuelve rutas protegidas.
 * - Si la sesión está cargando → muestra spinner
 * - Si no hay usuario → redirige a /login preservando la ruta
 * - Si hay usuario → renderiza children
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Guardamos la ruta que intentaron acceder para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
