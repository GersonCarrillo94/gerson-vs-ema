import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { MultipleChoiceActivity, ActivityResult } from '../../types';

interface MultipleChoiceProps {
  activity: MultipleChoiceActivity;
  onComplete: (result: ActivityResult) => void;
}

type AnswerState = 'idle' | 'correct' | 'wrong';

export function MultipleChoice({ activity, onComplete }: MultipleChoiceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [correctCount, setCorrectCount] = useState(0);

  const item = activity.items[currentIndex]!;
  const isLast = currentIndex === activity.items.length - 1;

  function handleSelect(optionIndex: number) {
    if (answerState !== 'idle') return;

    setSelectedIndex(optionIndex);
    const isCorrect = optionIndex === item.correctIndex;
    setAnswerState(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrectCount((c) => c + 1);
  }

  function handleNext() {
    if (isLast) {
      const finalCorrect = correctCount + (answerState === 'correct' ? 1 : 0);
      onComplete({
        activityId: activity.id,
        correct: finalCorrect,
        total: activity.items.length,
        score: Math.round((finalCorrect / activity.items.length) * 100),
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setAnswerState('idle');
    }
  }

  const optionBase =
    'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150';

  function optionClass(index: number) {
    if (answerState === 'idle') {
      return `${optionBase} border-gray-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50`;
    }
    if (index === item.correctIndex) {
      return `${optionBase} border-emerald-500 bg-emerald-50 text-emerald-800`;
    }
    if (index === selectedIndex && answerState === 'wrong') {
      return `${optionBase} border-red-400 bg-red-50 text-red-700`;
    }
    return `${optionBase} border-gray-100 bg-gray-50 text-gray-400`;
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Progreso */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>
          {currentIndex + 1} / {activity.items.length}
        </span>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${String(((currentIndex + 1) / activity.items.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* Pregunta */}
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
        <p className="text-base font-semibold text-gray-900">{item.prompt}</p>
      </div>

      {/* Opciones */}
      <div className="flex flex-col gap-2">
        {item.options.map((option, i) => (
          <button key={i} className={optionClass(i)} onClick={() => { handleSelect(i); }}>
            <span className="mr-2 font-bold text-gray-400">
              {String.fromCharCode(65 + i)}.
            </span>
            {option}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {answerState !== 'idle' && (
        <div
          className={[
            'rounded-xl p-3 text-sm',
            answerState === 'correct'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200',
          ].join(' ')}
        >
          {answerState === 'correct' ? '✅ ¡Correcto! ' : '❌ Incorrecto. '}
          {item.explanation && <span>{item.explanation}</span>}
        </div>
      )}

      {/* Botón siguiente */}
      {answerState !== 'idle' && (
        <Button onClick={handleNext} className="w-full">
          {isLast ? 'Ver resultado' : 'Siguiente →'}
        </Button>
      )}
    </div>
  );
}
