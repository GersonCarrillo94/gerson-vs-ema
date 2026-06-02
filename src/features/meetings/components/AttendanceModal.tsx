import { useState } from 'react';
import type { Meeting } from '../types';
import { TOPIC_CATEGORIES } from '../types';

interface Props {
  meeting: Meeting;
  iAmCreator: boolean;
  onSubmit: (attended: boolean, actualDuration?: number) => Promise<void>;
  onClose: () => void;
}

export function AttendanceModal({ meeting, iAmCreator, onSubmit, onClose }: Props) {
  const [attended, setAttended] = useState<boolean | null>(null);
  const [actualDuration, setActualDuration] = useState(meeting.duration_estimate_minutes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topicCfg = TOPIC_CATEGORIES[meeting.topic_category];
  const scheduledDate = new Date(meeting.scheduled_at).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const scheduledTime = new Date(meeting.scheduled_at).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  });

  async function handleSubmit() {
    if (attended === null) return;
    setIsSubmitting(true);
    try {
      await onSubmit(attended, attended ? actualDuration : undefined);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📋</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">¿Asististe a la reunión?</h2>
          <p className="text-sm text-gray-500 mt-1 capitalize">
            {scheduledDate} · {scheduledTime}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {topicCfg.emoji} {meeting.topic}
          </p>
        </div>

        {/* Botones Sí / No */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setAttended(true)}
            className={[
              'py-4 rounded-2xl text-sm font-semibold border-2 transition-all',
              attended === true
                ? 'bg-green-500 border-green-500 text-white shadow-md scale-105'
                : 'bg-white border-gray-200 text-gray-600 hover:border-green-300',
            ].join(' ')}
          >
            ✅ Sí asistí
          </button>
          <button
            onClick={() => setAttended(false)}
            className={[
              'py-4 rounded-2xl text-sm font-semibold border-2 transition-all',
              attended === false
                ? 'bg-red-500 border-red-500 text-white shadow-md scale-105'
                : 'bg-white border-gray-200 text-gray-600 hover:border-red-300',
            ].join(' ')}
          >
            ❌ No asistí
          </button>
        </div>

        {/* Duración real (solo si asistió y fue videollamada) */}
        {attended && meeting.is_video_call && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Duración real de la videollamada
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={90}
                value={actualDuration}
                onChange={(e) => setActualDuration(Number(e.target.value))}
                className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-500">minutos</span>
              <span className="text-xs text-gray-400">(estimado: {meeting.duration_estimate_minutes} min)</span>
            </div>
          </div>
        )}

        {/* Info de puntos */}
        {attended !== null && (
          <div className={`rounded-xl px-3 py-2.5 mb-4 text-xs ${attended ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {attended
              ? '🎉 Ganarás +100 puntos por asistir.'
              : '⚠️ Perderás 300 puntos por no asistir.'}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Después
          </button>
          <button
            onClick={handleSubmit}
            disabled={attended === null || isSubmitting}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
