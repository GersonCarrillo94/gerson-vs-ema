import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { FlashcardsActivity, ActivityResult } from '../../types';

interface FlashcardsProps {
  activity: FlashcardsActivity;
  onComplete: (result: ActivityResult) => void;
}

export function Flashcards({ activity, onComplete }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  const item = activity.items[currentIndex];
  const isLast = currentIndex === activity.items.length - 1;

  function handleFlip() {
    setIsFlipped((prev) => !prev);
  }

  function handleNext() {
    setSeen((prev) => new Set(prev).add(currentIndex));
    setIsFlipped(false);

    if (isLast) {
      // Todas las flashcards vistas = 100% de esta actividad
      onComplete({
        activityId: activity.id,
        correct: activity.items.length,
        total: activity.items.length,
        score: 100,
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      {/* Progreso */}
      <div className="w-full flex items-center gap-2 text-sm text-gray-500">
        <span>
          {currentIndex + 1} / {activity.items.length}
        </span>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / activity.items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Tarjeta con flip */}
      <button
        onClick={handleFlip}
        className="w-full max-w-sm h-48 perspective-1000 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
        aria-label={isFlipped ? `Respuesta: ${item.back}` : `Pregunta: ${item.front}. Toca para ver la respuesta.`}
      >
        <div
          className={[
            'relative w-full h-full transition-transform duration-500 transform-style-preserve-3d',
            isFlipped && '[transform:rotateY(180deg)]',
          ].join(' ')}
        >
          {/* Frente */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white border-2 border-blue-100 shadow-md backface-hidden p-6 text-center">
            <span className="text-3xl font-bold text-gray-900">{item.front}</span>
            {!isFlipped && (
              <span className="mt-3 text-xs text-gray-400">Toca para ver la traducción</span>
            )}
          </div>

          {/* Reverso */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-blue-50 border-2 border-blue-200 shadow-md backface-hidden p-6 text-center [transform:rotateY(180deg)]">
            <span className="text-2xl font-bold text-blue-700">{item.back}</span>
            {item.example && (
              <p className="mt-3 text-sm text-gray-600 italic">"{item.example}"</p>
            )}
          </div>
        </div>
      </button>

      <Button
        onClick={handleNext}
        disabled={!isFlipped && !seen.has(currentIndex)}
        className="w-full max-w-sm"
      >
        {isLast ? 'Terminar' : 'Siguiente →'}
      </Button>

      {!isFlipped && !seen.has(currentIndex) && (
        <p className="text-xs text-gray-400">Voltea la tarjeta antes de continuar</p>
      )}
    </div>
  );
}
