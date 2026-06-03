import type { Level } from '../types';

export const LEVELS: readonly Level[] = [
  { number: 1, name: 'Principiante', minScore: 0,    maxScore: 299,      emoji: '🌱', colorClass: 'text-green-700',  bgClass: 'bg-green-50  border-green-200'  },
  { number: 2, name: 'Aprendiz',     minScore: 300,  maxScore: 699,      emoji: '📚', colorClass: 'text-blue-700',   bgClass: 'bg-blue-50   border-blue-200'   },
  { number: 3, name: 'Estudiante',   minScore: 700,  maxScore: 1299,     emoji: '🎓', colorClass: 'text-indigo-700', bgClass: 'bg-indigo-50 border-indigo-200' },
  { number: 4, name: 'Intermedio',   minScore: 1300, maxScore: 2199,     emoji: '🏆', colorClass: 'text-yellow-700', bgClass: 'bg-yellow-50 border-yellow-200' },
  { number: 5, name: 'Avanzado',     minScore: 2200, maxScore: 3299,     emoji: '⭐', colorClass: 'text-orange-700', bgClass: 'bg-orange-50 border-orange-200' },
  { number: 6, name: 'Experto',      minScore: 3300, maxScore: 4699,     emoji: '💎', colorClass: 'text-purple-700', bgClass: 'bg-purple-50 border-purple-200' },
  { number: 7, name: 'Maestro',      minScore: 4700, maxScore: Infinity, emoji: '🔮', colorClass: 'text-rose-700',   bgClass: 'bg-rose-50   border-rose-200'   },
] as const;

export function getLevelFromScore(score: number): Level {
  return (
    [...LEVELS].reverse().find((l) => score >= l.minScore) ?? LEVELS[0]!
  );
}

export function getProgressInLevel(score: number): number {
  const level = getLevelFromScore(score);
  if (level.maxScore === Infinity) return 100;
  const range = level.maxScore - level.minScore + 1;
  return Math.min(100, Math.round(((score - level.minScore) / range) * 100));
}

export function pointsToNextLevel(score: number): number | null {
  const level = getLevelFromScore(score);
  if (level.maxScore === Infinity) return null;
  return level.maxScore - score + 1;
}
