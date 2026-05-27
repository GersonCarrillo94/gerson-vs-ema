import { useAuth } from '@/features/auth/hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">
        ¡Hola, {user?.display_name ?? 'viajero'}! 👋
      </h1>
      <p className="mt-1 text-gray-500">
        Aprendiendo{' '}
        <span className="font-medium text-brand-gerson">
          {user?.language_learning === 'english' ? 'inglés' : 'español'}
        </span>
      </p>

      {/* Placeholder — se construye en Fase 3 */}
      <div className="mt-8 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
        <p className="text-lg font-medium">Dashboard</p>
        <p className="text-sm">Se construye en Fase 3 — Gamificación</p>
      </div>
    </div>
  );
}
