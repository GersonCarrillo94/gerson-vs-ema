import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  fetchUserProgress,
  fetchSublevelContent,
  initializeProgress,
  startSublevel,
  completeSublevel,
} from '../services/lessonService';
import type { SublevelWithProgress, SublevelResult } from '../types';

const LEVELS = {
  basic: { min: 1, max: 12 },
  intermediate: { min: 13, max: 24 },
  advanced: { min: 25, max: 36 },
} as const;

function getLevelName(n: number): 'basic' | 'intermediate' | 'advanced' {
  if (n <= LEVELS.basic.max) return 'basic';
  if (n <= LEVELS.intermediate.max) return 'intermediate';
  return 'advanced';
}

// ─── Hook principal: mapa completo de subniveles ──────────────────────────────

export function useSublevelsMap() {
  const { user } = useAuth();
  const language = user?.language_learning ?? 'english';

  // 1. Inicializar progreso si es la primera vez (solo corre una vez)
  const initMutation = useMutation({ mutationFn: initializeProgress });

  // 2. Cargar progreso del usuario
  const progressQuery = useQuery({
    queryKey: ['sublevel_progress', user?.id],
    queryFn: async () => {
      // Inicializar si no hay progreso previo
      const progress = await fetchUserProgress();
      if (progress.length === 0) {
        await initializeProgress();
        return fetchUserProgress();
      }
      return progress;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // 3. Construir los 36 nodos del mapa combinando el progreso con metadata estática
  const sublevels: SublevelWithProgress[] = Array.from({ length: 36 }, (_, i) => {
    const number = i + 1;
    const progressRow = progressQuery.data?.find((p) => p.sublevel_number === number);
    const level = getLevelName(number);

    return {
      // Campos estáticos mínimos para renderizar la tarjeta (sin cargar el JSON)
      id: `${language === 'english' ? 'en' : 'es'}-sublevel-${String(number).padStart(2, '0')}`,
      language: language as 'english' | 'spanish',
      number,
      level,
      title: '',         // se carga cuando el usuario abre el subnivel
      description: '',
      estimatedMinutes: 0,
      pointsReward: level === 'basic' ? 100 : level === 'intermediate' ? 150 : 200,
      passingScore: 70,
      activities: [],
      // Campos de progreso
      status: progressRow?.status ?? 'locked',
      score_earned: progressRow?.score_earned ?? 0,
      completed_at: progressRow?.completed_at ?? null,
    };
  });

  return {
    sublevels,
    isLoading: progressQuery.isLoading,
    isError: progressQuery.isError,
    error: progressQuery.error,
    refetch: progressQuery.refetch,
    _initMutation: initMutation,
  };
}

// ─── Hook: detalle de un subnivel ─────────────────────────────────────────────

export function useSublevelDetail(sublevelNumber: number) {
  const { user } = useAuth();
  const language = user?.language_learning ?? 'english';

  // Cargar el contenido JSON
  const contentQuery = useQuery({
    queryKey: ['sublevel_content', language, sublevelNumber],
    queryFn: () => fetchSublevelContent(language as 'english' | 'spanish', sublevelNumber),
    enabled: !!user && sublevelNumber >= 1 && sublevelNumber <= 36,
    staleTime: Infinity, // el contenido no cambia
  });

  // Cargar el progreso para saber si está active/completed
  const progressQuery = useQuery({
    queryKey: ['sublevel_progress', user?.id],
    queryFn: fetchUserProgress,
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const progressRow = progressQuery.data?.find((p) => p.sublevel_number === sublevelNumber);

  return {
    sublevel: contentQuery.data,
    status: progressRow?.status ?? 'locked',
    score_earned: progressRow?.score_earned ?? 0,
    isLoading: contentQuery.isLoading || progressQuery.isLoading,
    isError: contentQuery.isError,
    error: contentQuery.error,
  };
}

// ─── Hook: iniciar subnivel ───────────────────────────────────────────────────

export function useStartSublevel() {
  return useMutation({ mutationFn: startSublevel });
}

// ─── Hook: completar subnivel ─────────────────────────────────────────────────

export function useCompleteSublevel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: completeSublevel,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sublevel_progress', user?.id],
      });
    },
  });
}
