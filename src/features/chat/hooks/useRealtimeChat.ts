import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message } from '../types';

export function useRealtimeChat(
  myId: string | undefined,
  onNewMessage: (msg: Message) => void,
  onMessageRead?: (msgId: string, readAt: string) => void,
) {
  const newMsgRef = useRef(onNewMessage);
  newMsgRef.current = onNewMessage;

  const readRef = useRef(onMessageRead);
  readRef.current = onMessageRead;

  useEffect(() => {
    if (!myId) return;

    const channel = supabase
      .channel(`chat:${myId}`)
      // New messages sent TO me
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${myId}` },
        (payload) => {
          newMsgRef.current(payload.new as Message);
        },
      )
      // My sent messages being read by the other person
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${myId}` },
        (payload) => {
          const updated = payload.new as Message;
          if (updated.read_at) {
            readRef.current?.(updated.id, updated.read_at);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [myId]);
}
