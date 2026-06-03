import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import type { FillBlankActivity, ActivityResult } from '../../types';

interface FillInBlankProps {
  activity: FillBlankActivity;
  onComplete: (result: ActivityResult) => void;
}

type ItemState = 'idle' | 'correct' | 'wrong';

export function FillInBlank({ activity, onComplete }: FillInBlankProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputs, setInputs] = useState<string[]>([]);
  const [itemState, setItemState] = useState<ItemState>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const item = activity.items[currentIndex]!;
  const isLast = currentIndex === activity.items.length - 1;

  // Inicializar array de inputs para los huecos del ítem actual
  const blankCount = item.blanks.length;
  const currentInputs: string[] = inputs.length === blankCount ? inputs : Array<string>(blankCount).fill('');

  function handleChange(blankIndex: number, value: string) {
    const updated = [...currentInputs];
    updated[blankIndex] = value;
    setInputs(updated);
  }

  function normalize(s: string) {
    return s.trim().toLowerCase();
  }

  function checkAnswer() {
    const allCorrect = item.blanks.every((blank, i) => {
      const userAnswer = normalize(currentInputs[i] ?? '');
      const correct = normalize(blank.answer);
      const alternatives = blank.alternatives?.map(normalize) ?? [];
      return userAnswer === correct || alternatives.includes(userAnswer);
    });

    setItemState(allCorrect ? 'correct' : 'wrong');
    if (allCorrect) setCorrectCount((c) => c + 1);
  }

  function handleNext() {
    if (isLast) {
      const finalCorrect = correctCount + (itemState === 'correct' ? 1 : 0);
      onComplete({
        activityId: activity.id,
        correct: finalCorrect,
        total: activity.items.length,
        score: Math.round((finalCorrect / activity.items.length) * 100),
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setInputs([]);
      setItemState('idle');
    }
  }

  // Renderizar la frase con los huecos como inputs inline
  function renderSentence() {
    const parts = item.sentence.split('___');
    return parts.map((part, i) => (
      <span key={i}>
        <span>{part}</span>
        {i < item.blanks.length && (
          <input
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            value={currentInputs[i] ?? ''}
            onChange={(e) => { handleChange(i, e.target.value); }}
            disabled={itemState !== 'idle'}
            placeholder="___"
            className={[
              'inline-block w-28 mx-1 px-2 py-1 border-b-2 bg-transparent text-center',
              'text-base font-semibold outline-none transition-colors',
              itemState === 'idle' && 'border-blue-400 focus:border-blue-600',
              itemState === 'correct' && 'border-emerald-500 text-emerald-700',
              itemState === 'wrong' && 'border-red-400 text-red-600',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        )}
      </span>
    ));
  }

  const hasInput = currentInputs.some((v) => v.trim().length > 0);

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

      {/* Frase con huecos */}
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-6 text-xl leading-relaxed text-gray-900 text-center">
        {renderSentence()}
      </div>

      {/* Pista */}
      {item.hint && itemState === 'idle' && (
        <p className="text-xs text-gray-500 text-center italic">💡 {item.hint}</p>
      )}

      {/* Respuesta correcta cuando falla */}
      {itemState === 'wrong' && (
        <div className="rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-200">
          ❌ Respuesta correcta:{' '}
          <strong>{item.blanks.map((b) => b.answer).join(' / ')}</strong>
        </div>
      )}

      {itemState === 'correct' && (
        <div className="rounded-xl p-3 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
          ✅ ¡Correcto!
        </div>
      )}

      {/* Botones */}
      {itemState === 'idle' ? (
        <Button onClick={checkAnswer} disabled={!hasInput} className="w-full">
          Comprobar
        </Button>
      ) : (
        <Button onClick={handleNext} className="w-full">
          {isLast ? 'Ver resultado' : 'Siguiente →'}
        </Button>
      )}
    </div>
  );
}
