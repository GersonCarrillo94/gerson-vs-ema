import { supabase } from '@/lib/supabase';
import { getLevelFromScore, getProgressInLevel } from '../utils/levelConfig';
import type { MyScoreData, PartnerScoreData } from '../types';

export async function fetchMyScoreData(): Promise<MyScoreData> {
  const [userResult, eventsResult, progressResult] = await Promise.all([
    supabase
      .from('users')
      .select('total_score, current_streak, longest_streak, last_activity_at')
      .single(),
    supabase
      .from('score_events')
      .select('id, event_type, points, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('sublevel_progress')
      .select('sublevel_number, status')
      .order('sublevel_number'),
  ]);

  if (userResult.error) throw userResult.error;

  const user = userResult.data;
  const events = eventsResult.data ?? [];
  const progress = progressResult.data ?? [];

  const completedSublevels = progress.filter((p) => p.status === 'completed').length;
  const nextActiveSublevel =
    progress.find((p) => p.status === 'active')?.sublevel_number ?? null;

  return {
    totalScore: user.total_score,
    currentStreak: user.current_streak,
    longestStreak: user.longest_streak,
    lastActivityAt: user.last_activity_at,
    level: getLevelFromScore(user.total_score),
    progressInLevel: getProgressInLevel(user.total_score),
    recentEvents: events,
    nextActiveSublevel,
    completedSublevels,
  };
}

export async function fetchPartnerScoreData(
  partnerId: string,
): Promise<PartnerScoreData | null> {
  const [partnerResult, progressResult] = await Promise.all([
    supabase
      .from('users')
      .select(
        'id, display_name, avatar_url, language_learning, total_score, current_streak, longest_streak, last_activity_at',
      )
      .eq('id', partnerId)
      .single(),
    supabase
      .from('sublevel_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', partnerId)
      .eq('status', 'completed'),
  ]);

  if (partnerResult.error) return null;

  const partner = partnerResult.data;
  const completedSublevels = progressResult.count ?? 0;

  return {
    id: partner.id,
    displayName: partner.display_name,
    avatarUrl: partner.avatar_url,
    languageLearning: partner.language_learning as 'english' | 'spanish',
    totalScore: partner.total_score,
    currentStreak: partner.current_streak,
    longestStreak: partner.longest_streak,
    lastActivityAt: partner.last_activity_at,
    level: getLevelFromScore(partner.total_score),
    progressInLevel: getProgressInLevel(partner.total_score),
    completedSublevels,
  };
}
