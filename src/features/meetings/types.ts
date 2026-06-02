import type { Database } from '@/types/database';

export type MeetingStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'missed' | 'cancelled';
export type TopicCategory = 'vocabulary' | 'grammar' | 'conversation' | 'pronunciation' | 'task' | 'other';
export type DurationEstimate = 15 | 30 | 45 | 60 | 90;

export type Meeting = Database['public']['Tables']['meetings']['Row'];
export type MeetingTimer = Database['public']['Tables']['meeting_timer']['Row'];

export interface CreateMeetingInput {
  scheduled_date: string;
  scheduled_time: string;
  duration_estimate_minutes: DurationEstimate;
  location: string;
  is_video_call: boolean;
  topic: string;
  topic_category: TopicCategory;
  notes: string;
}

export interface AttendanceInput {
  meetingId: string;
  iAmCreator: boolean;
  iAttended: boolean;
  actualDurationMinutes?: number;
}

export interface MeetingTimerStats {
  minutesBudget: number;
  minutesUsed: number;
  minutesRemaining: number;
  percentUsed: number;
  isLow: boolean;
  yearMonth: string;
}

export const TOPIC_CATEGORIES: Record<TopicCategory, { label: string; emoji: string }> = {
  vocabulary:    { label: 'Vocabulario',   emoji: '📚' },
  grammar:       { label: 'Gramática',     emoji: '✏️' },
  conversation:  { label: 'Conversación',  emoji: '💬' },
  pronunciation: { label: 'Pronunciación', emoji: '🎤' },
  task:          { label: 'Tarea',         emoji: '📝' },
  other:         { label: 'Otro',          emoji: '⭐' },
};

export const DURATION_OPTIONS: DurationEstimate[] = [15, 30, 45, 60, 90];

export const STATUS_CONFIG: Record<MeetingStatus, { label: string; color: string; dot: string }> = {
  pending:   { label: 'Pendiente',   color: 'text-amber-600 bg-amber-50 border-amber-200',   dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmada',  color: 'text-green-600 bg-green-50 border-green-200',   dot: 'bg-green-500' },
  completed: { label: 'Completada',  color: 'text-blue-600 bg-blue-50 border-blue-200',      dot: 'bg-blue-500' },
  missed:    { label: 'Faltó',       color: 'text-red-600 bg-red-50 border-red-200',         dot: 'bg-red-500' },
  rejected:  { label: 'Rechazada',   color: 'text-gray-500 bg-gray-50 border-gray-200',      dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelada',   color: 'text-gray-500 bg-gray-50 border-gray-200',      dot: 'bg-gray-300' },
};
