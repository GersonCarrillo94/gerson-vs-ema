import { FileAttachment } from './FileAttachment';
import type { Message } from '../types';

interface Props {
  message: Message;
  isOwn: boolean;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isOwn }: Props) {
  const isMedia = message.type === 'image' || message.type === 'video' || message.type === 'file';
  const isSticker = message.type === 'sticker';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-0.5`}>
        {/* Sticker: just a big emoji, no bubble */}
        {isSticker ? (
          <div className="text-5xl leading-none select-none" title="Sticker">
            {message.content}
          </div>
        ) : isMedia ? (
          /* Media/file: minimal bubble wrapping */
          <div className={`rounded-2xl overflow-hidden ${isOwn ? 'bg-brand-gerson' : 'bg-gray-100'} p-1.5`}>
            <FileAttachment message={message} />
          </div>
        ) : (
          /* Text / emoji */
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isOwn
                ? 'bg-brand-gerson text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            }`}
          >
            {message.content}
          </div>
        )}

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-gray-400">{formatTime(message.created_at)}</span>
          {isOwn && message.read_at && (
            <span className="text-[10px] text-brand-gerson" title="Visto">✓✓</span>
          )}
          {isOwn && !message.read_at && message.id.startsWith('temp-') && (
            <span className="text-[10px] text-gray-300">⏳</span>
          )}
        </div>
      </div>
    </div>
  );
}
