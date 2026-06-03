import type { MeetingTimerStats } from '../types';

interface Props {
  stats: MeetingTimerStats;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export function MeetingTimerPanel({ stats }: Props) {
  const dashOffset = CIRCUMFERENCE * (1 - stats.percentUsed / 100);
  const strokeColor = stats.isLow ? '#ef4444' : stats.percentUsed > 60 ? '#f59e0b' : '#6366f1';

  const hoursUsed = Math.floor(stats.minutesUsed / 60);
  const minsUsed = stats.minutesUsed % 60;
  const hoursRemaining = Math.floor(stats.minutesRemaining / 60);
  const minsRemaining = stats.minutesRemaining % 60;

  return (
    <div className={`rounded-2xl border p-5 ${stats.isLow ? 'border-red-200 bg-red-50' : 'border-indigo-100 bg-indigo-50'}`}>
      <div className="flex items-center gap-5">
        {/* Círculo SVG */}
        <div className="relative shrink-0">
          <svg width={120} height={120} viewBox="0 0 120 120">
            {/* Track */}
            <circle
              cx={60}
              cy={60}
              r={RADIUS}
              fill="none"
              stroke="#e0e7ff"
              strokeWidth={10}
            />
            {/* Progreso */}
            <circle
              cx={60}
              cy={60}
              r={RADIUS}
              fill="none"
              stroke={strokeColor}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
            />
          </svg>
          {/* Texto central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-gray-800 leading-none">
              {stats.percentUsed}%
            </span>
            <span className="text-[10px] text-gray-500 leading-none mt-0.5">usado</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2 capitalize">
            {monthLabel(stats.yearMonth)}
          </p>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Usados</span>
              <span className="font-semibold text-gray-800">
                {hoursUsed > 0 ? `${String(hoursUsed)}h ` : ''}{minsUsed}min
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Disponibles</span>
              <span className={`font-semibold ${stats.isLow ? 'text-red-600' : 'text-gray-800'}`}>
                {hoursRemaining > 0 ? `${String(hoursRemaining)}h ` : ''}{minsRemaining}min
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Presupuesto</span>
              <span className="text-gray-400">{stats.minutesBudget} min/mes</span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-3 h-1.5 rounded-full bg-white overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${String(stats.percentUsed)}%`, backgroundColor: strokeColor }}
            />
          </div>
        </div>
      </div>

      {/* Alerta de bajo presupuesto */}
      {stats.isLow && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700">
          <span>⚠️</span>
          <span>Quedan menos de 100 min este mes. Úsalos con cuidado.</span>
        </div>
      )}
    </div>
  );
}
