import { useEffect, useRef, useState } from 'react';

interface Props {
  roomUrl: string;
  onLeave: (durationMinutes: number) => void;
}

export function VideoCallRoom({ roomUrl, onLeave }: Props) {
  const startTimeRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Cronómetro de duración real de la llamada
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => { clearInterval(interval); };
  }, []);

  function formatElapsed(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function handleLeave() {
    const durationMinutes = Math.max(1, Math.round(elapsed / 60));
    onLeave(durationMinutes);
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-mono">{formatElapsed(elapsed)}</span>
        </div>

        <div className="text-center">
          <p className="text-gray-300 text-xs">Gerson VS Ema · Videollamada</p>
        </div>

        <button
          onClick={handleLeave}
          className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          📵 Salir
        </button>
      </div>

      {/* Iframe de Daily.co (Prebuilt UI) */}
      <iframe
        src={roomUrl}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        className="flex-1 w-full border-0"
        title="Videollamada"
      />
    </div>
  );
}
