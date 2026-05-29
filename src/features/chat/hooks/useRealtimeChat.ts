import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message } from '../types';

export function useRealtimeChat(
  myId: string | undefined,
  onNewMessage: (msg: Message) => void,
) {
  // Keep callback in a ref so the effect doesn't re-run when the callback identity changes
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  useEffect(() => {
    if (!myId) return;

    const channel = supabase
      .channel(`chat:${myId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${myId}`,
        },
        (payload) => {
          callbackRef.current(payload.new as Message);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [myId]);
}
