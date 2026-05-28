// ─── Progreso en DB ──────────────────────────────────────────────────────────

export type SublevelStatus = 'locked' | 'active' | 'completed';

export interface SublevelProgress {
  id: string;
  user_id: string;
  sublevel_number: number;
  status: SublevelStatus;
  score_earned: number;
  attempts: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Contenido estático (JSON) ────────────────────────────────────────────────

export type ActivityType =
  | 'flashcards'
  | 'multiple_choice'
  | 'fill_blank'
  | 'translation'
  | 'word_order'
  | 'listening'
  | 'pronunciation'
  | 'reading'
  | 'dialogue'
  | 'crossword'
  | 'writing'
  | 'word_game';

export type LevelName = 'basic' | 'intermediate' | 'advanced';

// Flashcards
export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  audioUrl?: string;
  example?: string;
}

export interface FlashcardsActivity {
  id: string;
  type: 'flashcards';
  title: string;
  items: FlashcardItem[];
}

// Opción múltiple
export interface MultipleChoiceItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface MultipleChoiceActivity {
  id: string;
  type: 'multiple_choice';
  title: string;
  items: MultipleChoiceItem[];
}

// Completar frase
export interface BlankAnswer {
  answer: string;
  alternatives?: string[];
}

export interface FillBlankItem {
  id: string;
  sentence: string;
  blanks: BlankAnswer[];
  hint?: string;
}

export interface FillBlankActivity {
  id: string;
  type: 'fill_blank';
  title: string;
  items: FillBlankItem[];
}

// Unión de actividades soportadas en Fase 2
export type Activity =
  | FlashcardsActivity
  | MultipleChoiceActivity
  | FillBlankActivity;

// Subnivel completo
export interface Sublevel {
  id: string;
  language: 'english' | 'spanish';
  number: number;
  level: LevelName;
  title: string;
  description: string;
  estimatedMinutes: number;
  pointsReward: number;
  passingScore: number;
  activities: Activity[];
}

// ─── Vista enriquecida (contenido + progreso) ─────────────────────────────────

export interface SublevelWithProgress extends Sublevel {
  status: SublevelStatus;
  score_earned: number;
  completed_at: string | null;
}

// ─── Resultado de una sesión de actividad ────────────────────────────────────

export interface ActivityResult {
  activityId: string;
  correct: number;
  total: number;
  /** puntos calculados para esta actividad (0-100) */
  score: number;
}

export interface SublevelResult {
  sublevelNumber: number;
  activities: ActivityResult[];
  /** puntaje final 0-100 */
  finalScore: number;
  passed: boolean;
}
