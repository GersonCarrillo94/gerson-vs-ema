import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMyScore, usePartnerScore } from '@/features/scoring/hooks/useScore';
import { LevelBadge } from '@/features/scoring/components/LevelBadge';
import { StreakBadge } from '@/features/scoring/components/StreakBadge';
import { Spinner } from '@/components/ui/Spinner';

function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const sizeClass = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' }[size];
  return (
    <div className={`${sizeClass} rounded-full bg-brand-gerson text-white font-bold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

function StatRow({ label, mine, theirs }: { label: string; mine: React.ReactNode; theirs: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="text-center">{mine}</div>
      <p className="text-xs text-center text-gray-400 font-medium">{label}</p>
      <div className="text-center">{theirs}</div>
    </div>
  );
}

export function PartnerProgressPage() {
  const { user } = useAuth();
  const { data: myScore, isLoading: myLoading } = useMyScore();
  const { data: partner, isLoading: partnerLoading } = usePartnerScore();

  const isLoading = myLoading || partnerLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user?.partner_id) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900">Mi compañero/a</h1>
        <div className="mt-8 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          <p className="text-3xl mb-3">👥</p>
          <p className="font-medium">Sin compañero vinculado</p>
          <p className="text-sm mt-1">Pide al equipo que vincule tu cuenta.</p>
        </div>
      </div>
    );
  }

  if (!partner || !myScore) return null;

  const myLangLabel = user.language_learning === 'english' ? 'Inglés' : 'Español';
  const partnerLangLabel = partner.languageLearning === 'english' ? 'Inglés' : 'Español';

  return (
    <div className="animate-fade-in space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Mi compañero/a</h1>

      {/* ── Cabeceras de comparación ── */}
      <div className="grid grid-cols-3 gap-2">
        {/* Yo */}
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white">
          <InitialsAvatar name={user.display_name} size="lg" />
          <p className="font-bold text-gray-900 text-sm text-center">{user.display_name}</p>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {myLangLabel}
          </span>
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
          <span className="text-2xl font-black text-gray-200">VS</span>
        </div>

        {/* Compañero */}
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-brand-ema bg-amber-50">
          <InitialsAvatar name={partner.displayName} size="lg" />
          <p className="font-bold text-gray-900 text-sm text-center">{partner.displayName}</p>
          <span className="text-xs text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
            {partnerLangLabel}
          </span>
        </div>
      </div>

      {/* ── Tabla de comparación ── */}
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2 divide-y divide-gray-100">
        <StatRow
          label="Nivel"
          mine={<LevelBadge level={myScore.level} size="sm" />}
          theirs={<LevelBadge level={partner.level} size="sm" />}
        />
        <StatRow
          label="Racha"
          mine={<StreakBadge streak={myScore.currentStreak} size="sm" />}
          theirs={<StreakBadge streak={partner.currentStreak} size="sm" />}
        />
        <StatRow
          label="Puntaje"
          mine={
            <span className="text-sm font-bold text-gray-900">
              {myScore.totalScore} <span className="font-normal text-gray-400">pts</span>
            </span>
          }
          theirs={
            <span className="text-sm font-bold text-gray-900">
              {partner.totalScore} <span className="font-normal text-gray-400">pts</span>
            </span>
          }
        />
        <StatRow
          label="Subniveles"
          mine={
            <span className="text-sm font-bold text-gray-900">
              {myScore.completedSublevels}
              <span className="font-normal text-gray-400">/36</span>
            </span>
          }
          theirs={
            <span className="text-sm font-bold text-gray-900">
              {partner.completedSublevels}
              <span className="font-normal text-gray-400">/36</span>
            </span>
          }
        />
        <StatRow
          label="Récord racha"
          mine={
            <span className="text-sm font-semibold text-gray-700">
              {myScore.longestStreak} días
            </span>
          }
          theirs={
            <span className="text-sm font-semibold text-gray-700">
              {partner.longestStreak} días
            </span>
          }
        />
      </div>

      {/* ── Quién va ganando ── */}
      {(() => {
        const diff = myScore.totalScore - partner.totalScore;
        if (diff === 0) {
          return (
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-center">
              <p className="text-lg font-bold text-gray-700">🤝 ¡Están empatados!</p>
            </div>
          );
        }
        const ahead = diff > 0;
        return (
          <div className={`rounded-2xl border p-4 text-center ${ahead ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`text-lg font-bold ${ahead ? 'text-blue-700' : 'text-amber-700'}`}>
              {ahead
                ? `¡Vas ganando por ${String(diff)} pts! 🏆`
                : `${partner.displayName} va ganando por ${String(Math.abs(diff))} pts 🔥`}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
