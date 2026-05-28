import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMyScore, usePartnerScore } from '@/features/scoring/hooks/useScore';
import { LevelBadge } from '@/features/scoring/components/LevelBadge';
import { StreakBadge } from '@/features/scoring/components/StreakBadge';
import { pointsToNextLevel } from '@/features/scoring/utils/levelConfig';
import { Spinner } from '@/components/ui/Spinner';

const EVENT_LABELS: Record<string, { icon: string; label: string }> = {
  sublevel_complete:              { icon: '✅', label: 'Completaste una lección' },
  streak_bonus_weekly:            { icon: '🔥', label: 'Bonus de racha semanal' },
  no_study_penalty:               { icon: '📉', label: 'Sin estudiar hoy' },
  consecutive_no_study_penalty:   { icon: '❌', label: '3 días sin estudiar' },
  level_complete:                 { icon: '🏅', label: 'Nivel completado' },
  first_try_bonus:                { icon: '⚡', label: 'Bonus primer intento' },
  meeting_attended:               { icon: '🤝', label: 'Reunión completada' },
  meeting_missed:                 { icon: '❌', label: 'Reunión perdida' },
  meeting_compensation:           { icon: '💰', label: 'Compensación de reunión' },
};

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'hace unos segundos';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  return `hace ${Math.floor(seconds / 86400)} días`;
}

function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const sizeClass = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return (
    <div className={`${sizeClass} rounded-full bg-brand-gerson text-white font-bold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data: score, isLoading } = useMyScore();
  const { data: partner } = usePartnerScore();

  const langLabel = user?.language_learning === 'english' ? 'inglés' : 'español';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!score) return null;

  const ptsToNext = pointsToNextLevel(score.totalScore);

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      {/* ── Cabecera ── */}
      <div className="flex items-center gap-3">
        <InitialsAvatar name={user?.display_name ?? '?'} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola, {user?.display_name ?? 'viajero'}!
          </h1>
          <p className="text-sm text-gray-500">
            Aprendiendo <span className="font-semibold text-brand-gerson">{langLabel}</span>
          </p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Nivel */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
          <LevelBadge level={score.level} size="sm" />
          <div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-gerson transition-all duration-700"
                style={{ width: `${score.progressInLevel}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {score.totalScore} pts
              {ptsToNext !== null
                ? ` · faltan ${ptsToNext} para Nv. ${score.level.number + 1}`
                : ' · ¡nivel máximo!'}
            </p>
          </div>
        </div>

        {/* Racha */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Racha</p>
          <StreakBadge streak={score.currentStreak} size="lg" />
          <p className="text-xs text-gray-400">
            Récord: {score.longestStreak} {score.longestStreak === 1 ? 'día' : 'días'}
          </p>
        </div>

        {/* Subniveles */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Progreso</p>
          <p className="text-3xl font-bold text-gray-900">
            {score.completedSublevels}
            <span className="text-base font-normal text-gray-400">/36</span>
          </p>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${(score.completedSublevels / 36) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">subniveles completados</p>
        </div>
      </div>

      {/* ── CTA: continuar aprendiendo ── */}
      {score.nextActiveSublevel !== null && (
        <Link
          to={`/lessons/${score.nextActiveSublevel}`}
          className="flex items-center justify-between rounded-2xl bg-brand-gerson text-white px-5 py-4 hover:bg-blue-600 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
              Continuar aprendiendo
            </p>
            <p className="text-base font-bold mt-0.5">
              Subnivel {score.nextActiveSublevel}
            </p>
          </div>
          <span className="text-2xl">→</span>
        </Link>
      )}

      {score.nextActiveSublevel === null && score.completedSublevels === 36 && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-center">
          <p className="text-2xl">🏆</p>
          <p className="font-bold text-amber-800 mt-1">¡Completaste los 36 subniveles!</p>
        </div>
      )}

      {/* ── Actividad reciente ── */}
      {score.recentEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Actividad reciente
          </h2>
          <div className="space-y-2">
            {score.recentEvents.map((event) => {
              const meta = EVENT_LABELS[event.event_type] ?? { icon: '📋', label: event.event_type };
              const isPositive = event.points > 0;
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(event.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{event.points} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Resumen del compañero ── */}
      {partner && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Tu compañero/a
          </h2>
          <Link
            to="/partner"
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <InitialsAvatar name={partner.displayName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{partner.displayName}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <LevelBadge level={partner.level} size="sm" />
                <StreakBadge streak={partner.currentStreak} size="sm" />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-900">{partner.totalScore} pts</p>
              <p className="text-xs text-gray-400">{partner.completedSublevels}/36</p>
            </div>
            <span className="text-gray-300 text-lg">›</span>
          </Link>
        </div>
      )}

      {!partner && user?.partner_id == null && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center text-gray-400">
          <p className="text-sm">Sin compañero vinculado aún.</p>
        </div>
      )}
    </div>
  );
}
