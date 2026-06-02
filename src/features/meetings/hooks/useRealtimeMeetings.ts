import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

/**
 * Suscripción Realtime a la tabla meetings.
 * Invalida el cache cada vez que hay un INSERT o UPDATE
 * en reuniones donde el usuario actual es participante.
 * Montar una sola vez en MeetingsPage.
 */
export function useRealtimeMeetings() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`meetings:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings',
          filter: `created_by=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ['meetings'] }),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings',
          filter: `partner_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ['meetings'] }),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_timer',
        },
        () => qc.invalidateQueries({ queryKey: ['meeting-timer'] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);
}
