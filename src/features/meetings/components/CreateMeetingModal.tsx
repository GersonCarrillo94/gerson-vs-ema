import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TOPIC_CATEGORIES, DURATION_OPTIONS } from '../types';
import type { CreateMeetingInput, DurationEstimate, TopicCategory } from '../types';

const schema = z.object({
  scheduled_date: z.string().min(1, 'Elige una fecha'),
  scheduled_time: z.string().min(1, 'Elige una hora'),
  duration_estimate_minutes: z.number(),
  is_video_call: z.boolean(),
  location: z.string(),
  topic: z.string().min(1, 'Escribe el tema').max(300),
  topic_category: z.string(),
  notes: z.string(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
  onSubmit: (data: CreateMeetingInput) => Promise<void>;
  minutesRemaining: number;
}

export function CreateMeetingModal({ onClose, onSubmit, minutesRemaining }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<DurationEstimate>(30);
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>('conversation');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      scheduled_date: '',
      scheduled_time: '',
      duration_estimate_minutes: 30,
      is_video_call: false,
      location: '',
      topic: '',
      topic_category: 'conversation',
      notes: '',
    },
  });

  const isVideoCall = watch('is_video_call');
  const wouldExceedBudget = isVideoCall && selectedDuration > minutesRemaining;

  async function handleFormSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        duration_estimate_minutes: selectedDuration,
        topic_category: selectedCategory,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Fecha mínima: hoy en zona horaria local (no UTC)
  const _d = new Date();
  const today = `${String(_d.getFullYear())}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Proponer reunión</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(handleFormSubmit)(e); }} className="p-5 space-y-5">
          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                min={today}
                {...register('scheduled_date')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.scheduled_date && (
                <p className="text-xs text-red-500 mt-1">{errors.scheduled_date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
              <input
                type="time"
                {...register('scheduled_time')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.scheduled_time && (
                <p className="text-xs text-red-500 mt-1">{errors.scheduled_time.message}</p>
              )}
            </div>
          </div>

          {/* Duración estimada */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Duración estimada</label>
            <div className="flex gap-2 flex-wrap">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(d);
                    setValue('duration_estimate_minutes', d);
                  }}
                  className={[
                    'px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors',
                    selectedDuration === d
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300',
                  ].join(' ')}
                >
                  {d} min
                </button>
              ))}
            </div>
            {/* Impacto en cronómetro */}
            {isVideoCall && (
              <p className={`text-xs mt-1.5 ${wouldExceedBudget ? 'text-red-500' : 'text-gray-400'}`}>
                {wouldExceedBudget
                  ? `⚠️ Supera el presupuesto disponible (${String(minutesRemaining)} min)`
                  : `Usará ~${String(selectedDuration)} min del cronómetro (${String(minutesRemaining)} disponibles)`}
              </p>
            )}
          </div>

          {/* Categoría de tema */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Categoría</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(TOPIC_CATEGORIES) as [TopicCategory, { label: string; emoji: string }][]).map(
                ([key, { label, emoji }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(key);
                      setValue('topic_category', key);
                    }}
                    className={[
                      'flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors',
                      selectedCategory === key
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span>{label}</span>
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Tema */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tema de estudio</label>
            <input
              type="text"
              placeholder='Ej: "Verbos irregulares en pasado"'
              {...register('topic')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.topic && (
              <p className="text-xs text-red-500 mt-1">{errors.topic.message}</p>
            )}
          </div>

          {/* Lugar / Videollamada */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Modalidad</label>
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('is_video_call')}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-gray-700">
                  📹 Videollamada <span className="text-gray-400 text-xs">(Daily.co)</span>
                </span>
              </label>
            </div>

            {!isVideoCall && (
              <input
                type="text"
                placeholder="Lugar físico (opcional)"
                {...register('location')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            )}

            {isVideoCall && wouldExceedBudget && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                Sin minutos suficientes. Reduce la duración o elige presencial.
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notas (opcional)</label>
            <textarea
              rows={2}
              placeholder="Recursos, material a preparar..."
              {...register('notes')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isVideoCall && wouldExceedBudget)}
              className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Proponer reunión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
