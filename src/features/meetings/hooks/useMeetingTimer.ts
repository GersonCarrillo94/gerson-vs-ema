import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { fetchMeetingTimer } from '../services/meetingService';
import type { MeetingTimerStats } from '../types';

const BUDGET = 500;

export function useMeetingTimer(): { stats: MeetingTimerStats | null; isLoading: boolean } {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  const partnerId = user?.partner_id ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['meeting-timer', userId, new Date().toISOString().slice(0, 7)],
    queryFn: () => fetchMeetingTimer(userId, partnerId),
    enabled: !!userId && !!partnerId,
    staleTime: 1000 * 60 * 5,
  });

  if (!data && !isLoading) {
    // Sin fila en DB = primer mes, nada usado aún
    const stats: MeetingTimerStats = {
      minutesBudget: BUDGET,
      minutesUsed: 0,
      minutesRemaining: BUDGET,
      percentUsed: 0,
      isLow: false,
      yearMonth: new Date().toISOString().slice(0, 7),
    };
    return { stats, isLoading: false };
  }

  if (isLoading || !data) return { stats: null, isLoading };

  const minutesUsed = data.minutes_used;
  const minutesBudget = data.minutes_budget;
  const minutesRemaining = Math.max(0, minutesBudget - minutesUsed);
  const percentUsed = Math.min(100, Math.round((minutesUsed / minutesBudget) * 100));

  const stats: MeetingTimerStats = {
    minutesBudget,
    minutesUsed,
    minutesRemaining,
    percentUsed,
    isLow: minutesRemaining <= 100,
    yearMonth: data.year_month,
  };

  return { stats, isLoading: false };
}
