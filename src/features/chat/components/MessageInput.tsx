import { useRef, useState } from 'react';
import { EmojiPicker } from './EmojiPicker';
import { StickerPicker } from './StickerPicker';
import {
  uploadChatFile,
  getFileCategory,
  fileCategoryToMessageType,
} from '../services/uploadService';
import type { SendMessagePayload } from '../types';

interface Props {
  onSend: (payload: Omit<SendMessagePayload, 'receiverId'>) => void | Promise<void>;
  onTyping: () => void;
  partnerId: string;
  myId: string;
  disabled?: boolean;
}

type ActivePicker = 'emoji' | 'sticker' | null;

export function MessageInput({ onSend, onTyping, partnerId, myId, disabled }: Props) {
  const [text, setText] = useState('');
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversationId = [myId, partnerId].sort().join('_');

  async function handleSendText() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    setText('');
    await onSend({ type: 'text', content: trimmed });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendText();
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const url = await uploadChatFile(file, conversationId);
      const category = getFileCategory(file);
      await onSend({
        type: fileCategoryToMessageType(category),
        content: url,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir el archivo.');
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function togglePicker(picker: ActivePicker) {
    setActivePicker((prev) => (prev === picker ? null : picker));
  }

  return (
    <div className="border-t border-gray-200 bg-white p-3 space-y-1">
      {uploadError && (
        <p className="text-xs text-red-500 px-1">{uploadError}</p>
      )}

      <div className="flex items-end gap-2">
        {/* Picker buttons */}
        <div className="relative flex items-center gap-1 pb-1 shrink-0">
          <button
            onClick={() => togglePicker('emoji')}
            className={`text-xl w-9 h-9 flex items-center justify-center rounded-full transition-colors ${activePicker === 'emoji' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            title="Emoji"
          >
            😀
          </button>
          <button
            onClick={() => togglePicker('sticker')}
            className={`text-xl w-9 h-9 flex items-center justify-center rounded-full transition-colors ${activePicker === 'sticker' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            title="Sticker"
          >
            🎭
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xl w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-40"
            title="Adjuntar archivo"
          >
            {isUploading ? '⏳' : '📎'}
          </button>

          {activePicker === 'emoji' && (
            <EmojiPicker
              onSelect={(emoji) => setText((t) => t + emoji)}
              onClose={() => setActivePicker(null)}
            />
          )}
          {activePicker === 'sticker' && (
            <StickerPicker
              onSelect={(emoji) => {
                void onSend({ type: 'sticker', content: emoji });
                setActivePicker(null);
              }}
              onClose={() => setActivePicker(null)}
            />
          )}
        </div>

        {/* Text area */}
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); onTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows={1}
          disabled={disabled || isUploading}
          className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gerson/40 focus:border-brand-gerson transition-colors min-h-[40px] max-h-[120px] overflow-y-auto"
        />

        {/* Send button */}
        <button
          onClick={() => void handleSendText()}
          disabled={!text.trim() || disabled || isUploading}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-brand-gerson text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Enviar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        onChange={handleFileSelect}
      />
    </div>
  );
}
