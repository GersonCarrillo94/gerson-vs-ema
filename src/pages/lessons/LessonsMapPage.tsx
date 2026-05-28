import { useSublevelsMap } from '@/features/lessons/hooks/useSublevels';
import { SublevelCard } from '@/features/lessons/components/SublevelCard';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/features/auth/hooks/useAuth';

const LEVEL_SECTIONS = [
  { key: 'basic', label: 'Básico', range: '1–12', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'intermediate', label: 'Intermedio', range: '13–24', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'advanced', label: 'Avanzado', range: '25–36', color: 'text-amber-600', bg: 'bg-amber-50' },
] as const;

export function LessonsMapPage() {
  const { user } = useAuth();
  const { sublevels, isLoading, isError } = useSublevelsMap();

  const langLabel = user?.language_learning === 'spanish' ? 'Español' : 'English';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        Error al cargar el progreso. Recarga la página.
      </div>
    );
  }

  const completed = sublevels.filter((s) => s.status === 'completed').length;
  const progressPct = Math.round((completed / 36) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Lecciones de {langLabel}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {completed} de 36 subniveles completados
        </p>
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400 text-right">{progressPct}%</p>
      </div>

      {/* Secciones por nivel */}
      {LEVEL_SECTIONS.map(({ key, label, range, color, bg }) => {
        const sectionSublevels = sublevels.filter((s) => s.level === key);
        const sectionCompleted = sectionSublevels.filter((s) => s.status === 'completed').length;

        return (
          <section key={key} className={`mb-8 rounded-2xl p-4 ${bg}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-lg font-bold ${color}`}>{label}</h2>
                <span className="text-xs text-gray-500">Subniveles {range}</span>
              </div>
              <span className={`text-sm font-semibold ${color}`}>
                {sectionCompleted}/12
              </span>
            </div>

            <div className="grid grid-cols-6 gap-x-3 gap-y-8 justify-items-center">
              {sectionSublevels.map((sublevel) => (
                <SublevelCard key={sublevel.number} sublevel={sublevel} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Leyenda */}
      <div className="flex items-center gap-4 justify-center mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-blue-500" /> Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-blue-100 border border-blue-300" /> Completado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-gray-100" /> 🔒 Bloqueado
        </span>
      </div>
    </div>
  );
}
