export interface Level {
  number: number;
  name: string;
  minScore: number;
  maxScore: number;
  emoji: string;
  colorClass: string;
  bgClass: string;
}

export interface ScoreEvent {
  id: string;
  event_type: string;
  points: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface MyScoreData {
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  level: Level;
  progressInLevel: number;
  recentEvents: ScoreEvent[];
  nextActiveSublevel: number | null;
  completedSublevels: number;
}

export interface PartnerScoreData {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  languageLearning: 'english' | 'spanish';
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  level: Level;
  progressInLevel: number;
  completedSublevels: number;
}
