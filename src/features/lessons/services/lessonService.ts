import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Sublevel, SublevelProgress, SublevelResult } from '../types';

// ─── Contenido estático ───────────────────────────────────────────────────────

// Vite importa todos los JSONs de lecciones de forma lazy (code-split por archivo)
const enLessons = import.meta.glob<Sublevel>('@/data/lessons/en/*.json', {
  import: 'default',
});
const esLessons = import.meta.glob<Sublevel>('@/data/lessons/es/*.json', {
  import: 'default',
});

/** Carga el JSON de un subnivel desde src/data/lessons/<lang>/sublevel-XX.json */
export async function fetchSublevelContent(
  language: 'english' | 'spanish',
  sublevelNumber: number,
): Promise<Sublevel> {
  const num = String(sublevelNumber).padStart(2, '0');
  const glob = language === 'english' ? enLessons : esLessons;
  const lang = language === 'english' ? 'en' : 'es';
  const key = `/src/data/lessons/${lang}/sublevel-${num}.json`;

  const loader = glob[key];
  if (!loader) {
    throw new Error(`No se encontró el subnivel ${sublevelNumber} para ${language}`);
  }
  return loader();
}

// ─── Progreso del usuario ─────────────────────────────────────────────────────

/** Obtiene todos los registros de progreso del usuario autenticado */
export async function fetchUserProgress(): Promise<SublevelProgress[]> {
  const { data, error } = await supabase
    .from('sublevel_progress')
    .select('*')
    .order('sublevel_number');

  if (error) {
    logger.error('fetchUserProgress failed', error);
    throw error;
  }

  return data as SublevelProgress[];
}

/** Obtiene el progreso del partner (solo lectura) */
export async function fetchPartnerProgress(): Promise<SublevelProgress[]> {
  // El partner_id se conoce via get_my_partner_id(); la RLS filtra automáticamente
  const { data, error } = await supabase
    .from('sublevel_progress')
    .select('*')
    .neq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .order('sublevel_number');

  if (error) {
    logger.error('fetchPartnerProgress failed', error);
    throw error;
  }

  return data as SublevelProgress[];
}

/** Inicializa el progreso si el usuario no tiene ningún registro (subnivel 1 → active) */
export async function initializeProgress(): Promise<void> {
  const { error } = await supabase.rpc('initialize_user_progress');
  if (error) {
    logger.error('initializeProgress failed', error);
    throw error;
  }
}

/** Registra el inicio de un subnivel */
export async function startSublevel(sublevelNumber: number): Promise<void> {
  const { error } = await supabase.rpc('start_sublevel', {
    p_sublevel_number: sublevelNumber,
  });
  if (error) {
    logger.error('startSublevel failed', error);
    throw error;
  }
}

// ─── Completar subnivel ───────────────────────────────────────────────────────

interface CompleteSublevelResult {
  success: boolean;
  points_earned?: number;
  next_sublevel?: number | null;
  error?: string;
}

/**
 * Llama a la RPC complete_sublevel.
 * Calcula el puntaje a partir del resultado de las actividades y lo envía.
 */
export async function completeSublevel(result: SublevelResult): Promise<CompleteSublevelResult> {
  // Convertir finalScore (0-100) a puntos según el nivel del subnivel
  // La RPC aplica el cap correcto (100/150/200) server-side.
  const { data, error } = await supabase.rpc('complete_sublevel', {
    p_sublevel_number: result.sublevelNumber,
    p_score_earned: result.finalScore,
  });

  if (error) {
    logger.error('completeSublevel RPC failed', error);
    throw error;
  }

  return data as CompleteSublevelResult;
}
