import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/features/scoring/components/ToastProvider';
import type { Meeting } from '@/features/meetings/types';

type RealtimePayload = { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Meeting; old: Partial<Meeting> };

function formatMeetingDate(scheduledAt: string): string {
  return new Date(scheduledAt).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Suscripción Realtime a la tabla meetings.
 * Invalida el cache y muestra toasts de notificación según el evento.
 * Montar una sola vez en MeetingsPage.
 */
export function useRealtimeMeetings() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user?.id) return;

    // supabase-js v2 overload types don't resolve 'postgres_changes' with custom callback types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ch = supabase.channel(`meetings:${user.id}`) as any;

    ch.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meetings', filter: `created_by=eq.${user.id}` },
      (payload: RealtimePayload) => {
        void qc.invalidateQueries({ queryKey: ['meetings'] });
        if (payload.eventType === 'UPDATE') {
          const status = payload.new.status;
          const date = formatMeetingDate(payload.new.scheduled_at);
          if (status === 'confirmed') {
            showToast({ type: 'success', message: `✅ Reunión confirmada — ${date}` });
          } else if (status === 'rejected') {
            showToast({ type: 'error', message: `❌ Reunión rechazada — ${date}` });
          }
        }
      },
    );

    ch.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meetings', filter: `partner_id=eq.${user.id}` },
      (payload: RealtimePayload) => {
        void qc.invalidateQueries({ queryKey: ['meetings'] });
        if (payload.eventType === 'INSERT') {
          const date = formatMeetingDate(payload.new.scheduled_at);
          showToast({ type: 'info', message: `📅 Nueva propuesta de reunión — ${date}`, duration: 6000 });
        } else if (payload.eventType === 'UPDATE' && payload.new.status === 'cancelled') {
          showToast({ type: 'error', message: '❌ Una reunión fue cancelada' });
        }
      },
    );

    ch.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meeting_timer' },
      () => { void qc.invalidateQueries({ queryKey: ['meeting-timer'] }); },
    );

    const channel = ch.subscribe() as ReturnType<typeof supabase.channel>;

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, qc, showToast]);
}
