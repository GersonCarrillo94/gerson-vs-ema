import type { Level } from '../types';

interface Props {
  level: Level;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelBadge({ level, showName = true, size = 'md' }: Props) {
  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${level.bgClass} ${level.colorClass} ${sizeClass}`}
    >
      <span>{level.emoji}</span>
      {showName && (
        <span>
          Nv. {level.number} {level.name}
        </span>
      )}
    </span>
  );
}
