import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMessages } from '@/features/chat/hooks/useMessages';
import { useTypingIndicator } from '@/features/chat/hooks/useTypingIndicator';
import { usePartnerScore } from '@/features/scoring/hooks/useScore';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { MessageInput } from '@/features/chat/components/MessageInput';
import { Spinner } from '@/components/ui/Spinner';

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 px-2 pb-1">
      <span className="inline-flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span>{name} está escribiendo...</span>
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  const label = new Date(date).toLocaleDateString([], {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function shouldShowDateSeparator(prev: string | undefined, curr: string): boolean {
  if (!prev) return true;
  return new Date(prev).toDateString() !== new Date(curr).toDateString();
}

export function ChatPage() {
  const { user } = useAuth();
  const { messages, isLoading, isError, send, myId, partnerId } = useMessages();
  const { data: partner } = usePartnerScore();
  const { partnerIsTyping, broadcastTyping } = useTypingIndicator(myId, partnerId ?? undefined);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, partnerIsTyping]);

  // Suppress unused variable warning — user is referenced indirectly via useMessages/useAuth chain
  void user;

  if (!partnerId) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center h-64 gap-4 text-center">
        <span className="text-4xl">💬</span>
        <h1 className="text-xl font-bold text-gray-900">Chat</h1>
        <p className="text-sm text-gray-500">Sin compañero vinculado todavía.</p>
      </div>
    );
  }

  const partnerName = partner?.displayName ?? '…';
  const partnerInitial = partnerName[0]?.toUpperCase() ?? '?';

  return (
    /* -mx-6 -my-6 cancels the p-6 of AppLayout's <main> so the chat fills edge-to-edge.
       height accounts for: mobile topbar (h-14 = 56px) OR no topbar (desktop). */
    <div
      className="-mx-6 flex flex-col overflow-hidden"
      style={{ height: 'calc(100dvh - 56px)', marginTop: '-1.5rem', marginBottom: '-1.5rem' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="w-10 h-10 rounded-full bg-brand-ema text-white font-bold flex items-center justify-center text-sm shrink-0">
          {partnerInitial}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{partnerName}</p>
          <p className="text-xs text-gray-400">
            {partner
              ? `Aprendiendo ${partner.languageLearning === 'english' ? 'inglés' : 'español'}`
              : ''}
          </p>
        </div>
      </div>

      {/* ── Messages list ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <p className="text-center text-sm text-red-500 py-8">
            No se pudieron cargar los mensajes.
          </p>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <span className="text-4xl">👋</span>
            <p className="text-sm font-medium text-gray-700">
              Empieza la conversación con {partnerName}
            </p>
            <p className="text-xs text-gray-400">Manda el primer mensaje</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id}>
            {shouldShowDateSeparator(messages[i - 1]?.created_at, msg.created_at) && (
              <DateSeparator date={msg.created_at} />
            )}
            <MessageBubble message={msg} isOwn={msg.sender_id === myId} />
          </div>
        ))}

        {partnerIsTyping && <TypingIndicator name={partnerName} />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      {myId && partnerId && (
        <MessageInput
          onSend={send}
          onTyping={broadcastTyping}
          partnerId={partnerId}
          myId={myId}
          disabled={isLoading}
        />
      )}
    </div>
  );
}
