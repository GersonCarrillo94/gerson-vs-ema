import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { TOPIC_CATEGORIES, DURATION_OPTIONS } from '../types';
import type { CreateInstantMeetingInput, DurationEstimate, TopicCategory } from '../types';

type FormData = {
  duration_estimate_minutes: number;
  is_video_call: boolean;
  topic: string;
  topic_category: string;
  notes: string;
};

interface Props {
  onClose: () => void;
  onSubmit: (data: CreateInstantMeetingInput) => Promise<void>;
  minutesRemaining: number;
}

export function InstantMeetingModal({ onClose, onSubmit, minutesRemaining }: Props) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<DurationEstimate>(30);
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>('conversation');

  const schema = useMemo(() => z.object({
    duration_estimate_minutes: z.number(),
    is_video_call: z.boolean(),
    topic: z.string().min(1, t('meetings.createModal.topicRequired')).max(300),
    topic_category: z.string(),
    notes: z.string(),
  }), [t]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration_estimate_minutes: 30,
      is_video_call: true,
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('meetings.instantModal.title')}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t('meetings.instantModal.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(handleFormSubmit)(e); }} className="p-5 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">{t('meetings.createModal.duration')}</label>
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
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300',
                  ].join(' ')}
                >
                  {d} min
                </button>
              ))}
            </div>
            {isVideoCall && (
              <p className={`text-xs mt-1.5 ${wouldExceedBudget ? 'text-red-500' : 'text-gray-400'}`}>
                {wouldExceedBudget
                  ? t('meetings.createModal.budgetExceeded', { count: minutesRemaining })
                  : t('meetings.createModal.willUse', { duration: selectedDuration, remaining: minutesRemaining })}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">{t('meetings.createModal.category')}</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(TOPIC_CATEGORIES) as [TopicCategory, { label: string; emoji: string }][]).map(
                ([key, { emoji }]) => (
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
                        ? 'bg-violet-50 border-violet-400 text-violet-700'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span>{t(`meetings.categories.${key}`)}</span>
                  </button>
                ),
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('meetings.createModal.topic')}</label>
            <input
              type="text"
              placeholder={t('meetings.instantModal.topicPlaceholder')}
              {...register('topic')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            {errors.topic && (
              <p className="text-xs text-red-500 mt-1">{errors.topic.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">{t('meetings.createModal.modality')}</label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('is_video_call')}
                className="w-4 h-4 accent-violet-600"
              />
              <span className="text-sm text-gray-700">
                {t('meetings.createModal.videoCall')} <span className="text-gray-400 text-xs">(Daily.co)</span>
              </span>
            </label>
            {isVideoCall && wouldExceedBudget && (
              <div className="mt-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                {t('meetings.instantModal.noMinutes')}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('meetings.createModal.notes')}</label>
            <textarea
              rows={2}
              placeholder={t('meetings.createModal.notesPlaceholder')}
              {...register('notes')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isVideoCall && wouldExceedBudget)}
              className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? t('meetings.createModal.submitting') : t('meetings.instantModal.submitButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
