/**
 * Tipos de la base de datos — generados manualmente hasta tener credenciales de Supabase.
 * Cuando tengas el proyecto creado, reemplaza con:
 *   npx supabase gen types typescript --project-id <ID> > src/types/database.ts
 */

type LearningLanguage = 'english' | 'spanish';
type SublevelStatus = 'locked' | 'active' | 'completed';
type ScoreEventType =
  | 'sublevel_complete'
  | 'level_complete'
  | 'streak_bonus_weekly'
  | 'no_study_penalty'
  | 'consecutive_no_study_penalty'
  | 'meeting_attended'
  | 'meeting_missed'
  | 'meeting_compensation'
  | 'first_try_bonus';
type MessageType = 'text' | 'image' | 'video' | 'file' | 'sticker' | 'emoji';
type MeetingStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'missed' | 'cancelled';

/** Forma que espera supabase-js v2 para el genérico Database */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          language_learning: LearningLanguage;
          partner_id: string | null;
          avatar_url: string | null;
          total_score: number;
          current_streak: number;
          longest_streak: number;
          last_activity_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          language_learning: LearningLanguage;
          partner_id?: string | null;
          avatar_url?: string | null;
          total_score?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          language_learning?: LearningLanguage;
          partner_id?: string | null;
          avatar_url?: string | null;
          total_score?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sublevel_progress: {
        Row: {
          id: string;
          user_id: string;
          sublevel_number: number;
          status: SublevelStatus;
          score_earned: number;
          attempts: number;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          sublevel_number: number;
          status?: SublevelStatus;
          score_earned?: number;
          attempts?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          status?: SublevelStatus;
          score_earned?: number;
          attempts?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      score_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: ScoreEventType;
          points: number;
          reference_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: ScoreEventType;
          points: number;
          reference_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          type: MessageType;
          content: string;
          file_name: string | null;
          file_size: number | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          type: MessageType;
          content: string;
          file_name?: string | null;
          file_size?: number | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
      meetings: {
        Row: {
          id: string;
          created_by: string;
          partner_id: string;
          scheduled_at: string;
          location: string | null;
          is_video_call: boolean;
          video_room_url: string | null;
          notes: string | null;
          status: MeetingStatus;
          confirmed_at: string | null;
          completed_at: string | null;
          missed_by: string | null;
          attended_by_creator: boolean | null;
          attended_by_partner: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          partner_id: string;
          scheduled_at: string;
          location?: string | null;
          is_video_call?: boolean;
          video_room_url?: string | null;
          notes?: string | null;
          status?: MeetingStatus;
          confirmed_at?: string | null;
          completed_at?: string | null;
          missed_by?: string | null;
          attended_by_creator?: boolean | null;
          attended_by_partner?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: MeetingStatus;
          confirmed_at?: string | null;
          completed_at?: string | null;
          missed_by?: string | null;
          attended_by_creator?: boolean | null;
          attended_by_partner?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
