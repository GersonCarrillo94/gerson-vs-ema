import { useNavigate } from 'react-router-dom';
import type { SublevelWithProgress } from '../types';

interface SublevelCardProps {
  sublevel: SublevelWithProgress;
}

const levelColor: Record<string, string> = {
  basic: 'level-basic',
  intermediate: 'level-intermediate',
  advanced: 'level-advanced',
};

export function SublevelCard({ sublevel }: SublevelCardProps) {
  const navigate = useNavigate();
  const { number, level, status, score_earned, pointsReward } = sublevel;

  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  function handleClick() {
    if (!isLocked) navigate(`/lessons/${number}`);
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      aria-label={
        isLocked
          ? `Subnivel ${number} — bloqueado`
          : isCompleted
            ? `Subnivel ${number} — completado con ${score_earned} pts`
            : `Subnivel ${number} — disponible`
      }
      className={[
        'relative flex flex-col items-center justify-center rounded-2xl',
        'w-16 h-16 sm:w-20 sm:h-20 transition-all duration-200 select-none',
        isLocked && 'bg-gray-100 text-gray-400 cursor-not-allowed',
        isActive && [
          'ring-2 ring-offset-2 shadow-lg',
          level === 'basic' && 'bg-blue-500 text-white ring-blue-400 hover:bg-blue-600',
          level === 'intermediate' && 'bg-emerald-500 text-white ring-emerald-400 hover:bg-emerald-600',
          level === 'advanced' && 'bg-amber-500 text-white ring-amber-400 hover:bg-amber-600',
          'animate-bounce-soft',
        ]
          .filter(Boolean)
          .join(' '),
        isCompleted && [
          'hover:brightness-110',
          level === 'basic' && 'bg-blue-100 text-blue-700',
          level === 'intermediate' && 'bg-emerald-100 text-emerald-700',
          level === 'advanced' && 'bg-amber-100 text-amber-700',
        ]
          .filter(Boolean)
          .join(' '),
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Número */}
      <span className="text-lg sm:text-xl font-bold leading-none">{number}</span>

      {/* Estado */}
      {isLocked && (
        <span className="text-base mt-0.5" aria-hidden="true">
          🔒
        </span>
      )}
      {isCompleted && (
        <span className="text-base mt-0.5" aria-hidden="true">
          ✅
        </span>
      )}
      {isActive && (
        <span className="text-xs mt-0.5 font-semibold opacity-90">
          {pointsReward}pts
        </span>
      )}

      {/* Puntaje obtenido al completar */}
      {isCompleted && score_earned > 0 && (
        <span className="absolute -bottom-5 text-[10px] font-medium opacity-70">
          {score_earned}pts
        </span>
      )}
    </button>
  );
}
