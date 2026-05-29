import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const TYPING_DEBOUNCE_MS = 1000;
const TYPING_EXPIRE_MS  = 3500;

export function useTypingIndicator(
  myId: string | undefined,
  partnerId: string | undefined,
) {
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const expireTimer = useRef<ReturnType<typeof setTimeout>>();
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!myId || !partnerId) return;

    // Stable key regardless of who is who
    const key = [myId, partnerId].sort().join(':');
    const channel = supabase
      .channel(`typing:${key}`)
      .on('broadcast', { event: 'typing' }, (payload: { payload?: { userId?: string } }) => {
        if (payload.payload?.userId === partnerId) {
          setPartnerIsTyping(true);
          clearTimeout(expireTimer.current);
          expireTimer.current = setTimeout(() => setPartnerIsTyping(false), TYPING_EXPIRE_MS);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      clearTimeout(expireTimer.current);
      clearTimeout(debounceTimer.current);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [myId, partnerId]);

  // Call this whenever the user types a character
  const broadcastTyping = useCallback(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: myId },
      });
    }, TYPING_DEBOUNCE_MS);
  }, [myId]);

  return { partnerIsTyping, broadcastTyping };
}
