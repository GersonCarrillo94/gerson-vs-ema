import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSublevelDetail, useStartSublevel, useCompleteSublevel } from '@/features/lessons/hooks/useSublevels';
import { Flashcards } from '@/features/lessons/components/activities/Flashcards';
import { MultipleChoice } from '@/features/lessons/components/activities/MultipleChoice';
import { FillInBlank } from '@/features/lessons/components/activities/FillInBlank';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/features/scoring/components/ToastProvider';
import { useMyScore } from '@/features/scoring/hooks/useScore';
import { getLevelFromScore } from '@/features/scoring/utils/levelConfig';
import type { ActivityResult, SublevelResult } from '@/features/lessons/types';

export function SublevelPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sublevelNumber = parseInt(id ?? '1', 10);

  const { sublevel, status, isLoading, isError } = useSublevelDetail(sublevelNumber);
  const startMutation = useStartSublevel();
  const completeMutation = useCompleteSublevel();
  const { showToast } = useToast();
  const { data: myScore } = useMyScore();

  const [activityIndex, setActivityIndex] = useState(0);
  const [activityResults, setActivityResults] = useState<ActivityResult[]>([]);
  const [phase, setPhase] = useState<'intro' | 'activity' | 'result'>('intro');

  // Registrar el inicio del subnivel al montar
  useEffect(() => {
    if (status === 'active') {
      startMutation.mutate(sublevelNumber);
    }
  }, [sublevelNumber, status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !sublevel) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-red-600">
        <p>No se pudo cargar la lección.</p>
        <Button variant="secondary" onClick={() => navigate('/lessons')}>
          Volver al mapa
        </Button>
      </div>
    );
  }

  if (status === 'locked') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-600">
        <span className="text-4xl">🔒</span>
        <p className="font-medium">Este subnivel está bloqueado.</p>
        <Button variant="secondary" onClick={() => navigate('/lessons')}>
          Volver al mapa
        </Button>
      </div>
    );
  }

  // ─── Fase: resultado final ────────────────────────────────────────────────

  if (phase === 'result') {
    const totalCorrect = activityResults.reduce((acc, r) => acc + r.correct, 0);
    const totalItems = activityResults.reduce((acc, r) => acc + r.total, 0);
    const finalScore = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;
    const passed = finalScore >= sublevel.passingScore;

    const result: SublevelResult = {
      sublevelNumber,
      activities: activityResults,
      finalScore,
      passed,
    };

    async function handleFinish() {
      try {
        const oldScore = myScore?.totalScore ?? 0;
        const newScore = oldScore + sublevel.pointsReward;
        const oldLevel = getLevelFromScore(oldScore);
        const newLevel = getLevelFromScore(newScore);

        await completeMutation.mutateAsync(result);

        if (newLevel.number > oldLevel.number) {
          showToast({
            type: 'success',
            message: `¡Subiste al Nv. ${newLevel.number} ${newLevel.name}! ${newLevel.emoji}`,
            duration: 5000,
          });
        } else {
          showToast({ type: 'success', message: `¡+${sublevel.pointsReward} pts ganados!` });
        }
        navigate('/lessons', { replace: true });
      } catch {
        // El error ya fue logueado en el servicio
      }
    }

    return (
      <div className="max-w-sm mx-auto px-4 py-10 flex flex-col items-center gap-6 animate-slide-up">
        <span className="text-6xl">{passed ? '🎉' : '😓'}</span>
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          {passed ? '¡Subnivel completado!' : 'Sigue practicando'}
        </h2>
        <div className="w-full rounded-2xl bg-gray-50 border border-gray-200 p-5 flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Puntaje</span>
            <span className="font-bold text-gray-900">{finalScore} / 100</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Mínimo para pasar</span>
            <span className="font-medium text-gray-700">{sublevel.passingScore}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Puntos ganados</span>
            <span className="font-bold text-emerald-600">
              {passed
                ? `+${sublevel.pointsReward} pts`
                : '0 pts'}
            </span>
          </div>
        </div>

        {passed ? (
          <Button
            onClick={handleFinish}
            isLoading={completeMutation.isPending}
            className="w-full"
          >
            Continuar →
          </Button>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={() => { setActivityIndex(0); setActivityResults([]); setPhase('intro'); }} className="w-full">
              Intentar de nuevo
            </Button>
            <Button variant="secondary" onClick={() => navigate('/lessons')} className="w-full">
              Volver al mapa
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ─── Fase: introducción ───────────────────────────────────────────────────

  if (phase === 'intro') {
    const levelLabel = sublevel.level === 'basic'
      ? 'Básico' : sublevel.level === 'intermediate'
        ? 'Intermedio' : 'Avanzado';

    return (
      <div className="max-w-sm mx-auto px-4 py-10 flex flex-col gap-6 animate-slide-up">
        <button
          onClick={() => navigate('/lessons')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver al mapa
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-5xl font-bold text-gray-900">{sublevelNumber}</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Nivel {levelLabel}
          </span>
          <h1 className="text-2xl font-bold text-gray-900">{sublevel.title}</h1>
          <p className="text-sm text-gray-500">{sublevel.description}</p>
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex justify-around text-center text-sm">
          <div>
            <p className="font-bold text-gray-900">{sublevel.activities.length}</p>
            <p className="text-gray-500">actividades</p>
          </div>
          <div>
            <p className="font-bold text-gray-900">{sublevel.estimatedMinutes} min</p>
            <p className="text-gray-500">estimado</p>
          </div>
          <div>
            <p className="font-bold text-emerald-600">+{sublevel.pointsReward} pts</p>
            <p className="text-gray-500">al completar</p>
          </div>
        </div>

        {status === 'completed' && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-center text-sm text-blue-700">
            ✅ Ya completaste este subnivel. Puedes volver a practicarlo.
          </div>
        )}

        <Button onClick={() => setPhase('activity')} className="w-full" size="lg">
          {status === 'completed' ? 'Practicar de nuevo' : 'Empezar'}
        </Button>
      </div>
    );
  }

  // ─── Fase: actividad ──────────────────────────────────────────────────────

  const currentActivity = sublevel.activities[activityIndex];

  function handleActivityComplete(result: ActivityResult) {
    const updatedResults = [...activityResults, result];
    setActivityResults(updatedResults);

    const isLastActivity = activityIndex === sublevel!.activities.length - 1;
    if (isLastActivity) {
      setPhase('result');
    } else {
      setActivityIndex((prev) => prev + 1);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/lessons')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <div className="flex-1 mx-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${(activityIndex / sublevel.activities.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {activityIndex + 1}/{sublevel.activities.length}
        </span>
      </div>

      {/* Título de la actividad */}
      <h2 className="text-base font-semibold text-gray-700 mb-4 text-center">
        {currentActivity.title}
      </h2>

      {/* Renderizar el tipo de actividad correcto */}
      {currentActivity.type === 'flashcards' && (
        <Flashcards
          key={`${activityIndex}-${currentActivity.id}`}
          activity={currentActivity}
          onComplete={handleActivityComplete}
        />
      )}

      {currentActivity.type === 'multiple_choice' && (
        <MultipleChoice
          key={`${activityIndex}-${currentActivity.id}`}
          activity={currentActivity}
          onComplete={handleActivityComplete}
        />
      )}

      {currentActivity.type === 'fill_blank' && (
        <FillInBlank
          key={`${activityIndex}-${currentActivity.id}`}
          activity={currentActivity}
          onComplete={handleActivityComplete}
        />
      )}

      {/* Tipo no soportado aún */}
      {currentActivity.type !== 'flashcards' &&
        currentActivity.type !== 'multiple_choice' &&
        currentActivity.type !== 'fill_blank' && (
          <div className="text-center text-gray-400 py-12">
            <p>Actividad tipo "{currentActivity.type}" aún no implementada.</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() =>
                handleActivityComplete({
                  activityId: currentActivity.id,
                  correct: 1,
                  total: 1,
                  score: 100,
                })
              }
            >
              Saltar actividad
            </Button>
          </div>
        )}
    </div>
  );
}
