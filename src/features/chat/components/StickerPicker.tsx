const STICKERS = [
  { id: 's1',  emoji: '😂', label: 'Muerto de risa' },
  { id: 's2',  emoji: '❤️', label: 'Amor' },
  { id: 's3',  emoji: '🎉', label: 'Celebración' },
  { id: 's4',  emoji: '👏', label: 'Aplausos' },
  { id: 's5',  emoji: '🔥', label: 'Fuego' },
  { id: 's6',  emoji: '💪', label: 'Fuerza' },
  { id: 's7',  emoji: '🤔', label: 'Pensando...' },
  { id: 's8',  emoji: '😴', label: 'Dormido' },
  { id: 's9',  emoji: '🙌', label: 'Manos arriba' },
  { id: 's10', emoji: '😎', label: 'Cool' },
  { id: 's11', emoji: '🥳', label: 'Fiesta' },
  { id: 's12', emoji: '🫶', label: 'Amor y paz' },
];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function StickerPicker({ onSelect, onClose }: Props) {
  return (
    <div className="absolute bottom-full mb-2 left-0 z-20 w-64 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stickers</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>
      <div className="grid grid-cols-4 gap-1 p-2">
        {STICKERS.map((s) => (
          <button
            key={s.id}
            onClick={() => { onSelect(s.emoji); onClose(); }}
            className="flex flex-col items-center gap-0.5 rounded-xl p-2 hover:bg-gray-100 transition-colors"
            title={s.label}
          >
            <span className="text-3xl leading-none">{s.emoji}</span>
            <span className="text-[9px] text-gray-400 truncate w-full text-center">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
