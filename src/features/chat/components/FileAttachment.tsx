import type { Message } from '../types';

interface Props {
  message: Message;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileAttachment({ message }: Props) {
  if (message.type === 'image') {
    return (
      <a href={message.content} target="_blank" rel="noopener noreferrer">
        <img
          src={message.content}
          alt={message.file_name ?? 'Imagen'}
          className="max-w-[220px] max-h-[220px] rounded-xl object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (message.type === 'video') {
    return (
      <video
        src={message.content}
        controls
        className="max-w-[280px] rounded-xl"
        preload="metadata"
      />
    );
  }

  // Generic file download
  return (
    <a
      href={message.content}
      download={message.file_name ?? 'archivo'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
    >
      <span className="text-2xl">📎</span>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate max-w-[160px]">
          {message.file_name ?? 'Archivo'}
        </p>
        {message.file_size !== null && (
          <p className="text-xs opacity-70">{formatBytes(message.file_size)}</p>
        )}
      </div>
      <span className="text-xs opacity-70 shrink-0">↓</span>
    </a>
  );
}
