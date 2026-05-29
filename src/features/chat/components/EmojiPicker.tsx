const EMOJI_GROUPS: Record<string, string[]> = {
  '😀 Caras': ['😀','😂','🥹','😍','🥰','😊','😎','🤔','😢','😡','🤗','😴','🤣','😅','🙄','😬','🤯','🥳','😏','😇'],
  '👋 Gestos': ['👍','👎','❤️','💔','👏','🙌','🤝','🙏','✌️','💪','🤜','🤛','🫶','🫂','✋','🤚'],
  '🎉 Objetos': ['🎉','🔥','⭐','🏆','💎','🎓','📚','💬','🎵','🍕','☕','🌈','✨','💡','🚀','🎯'],
  '🐱 Animales': ['🐱','🐶','🦊','🐻','🐼','🦁','🐯','🐨','🐸','🐧','🦋','🐝'],
};

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: Props) {
  return (
    <div className="absolute bottom-full mb-2 left-0 z-20 w-72 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden animate-slide-up">
      {/* Close bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Emoji</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>
      <div className="overflow-y-auto max-h-56 p-2 space-y-3">
        {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
          <div key={group}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 px-1">{group}</p>
            <div className="flex flex-wrap gap-0.5">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { onSelect(emoji); onClose(); }}
                  className="text-xl w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
