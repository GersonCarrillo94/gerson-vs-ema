import { useTranslation } from 'react-i18next';

interface Props {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ streak, size = 'md' }: Props) {
  const { t } = useTranslation();

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }[size];

  if (streak === 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-500 font-medium ${sizeClass}`}>
        💤 {t('common.noStreak')}
      </span>
    );
  }

  const colorClass =
    streak >= 30 ? 'bg-purple-100 text-purple-700' :
    streak >= 14 ? 'bg-orange-100 text-orange-700' :
    streak >= 7  ? 'bg-amber-100  text-amber-700'  :
                   'bg-red-100    text-red-700';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${colorClass} ${sizeClass}`}>
      🔥 {streak} {t(streak === 1 ? 'common.day' : 'common.days')}
    </span>
  );
}
