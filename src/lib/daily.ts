import { supabase } from './supabase';

export interface DailyRoom {
  roomName: string;
  roomUrl: string;
}

/**
 * Crea una sala de videollamada en Daily.co vía Edge Function.
 * La API key de Daily.co vive en Supabase secrets (nunca en el cliente).
 *
 * Deploy de la función:
 *   npx supabase functions deploy create-daily-room --project-ref <id>
 * Secreto requerido:
 *   npx supabase secrets set DAILY_API_KEY=<tu-api-key> --project-ref <id>
 */
export async function createDailyRoom(meetingId: string): Promise<DailyRoom> {
  const response = await supabase.functions.invoke<DailyRoom>('create-daily-room', {
    body: { meetingId },
  });

  const data = response.data;
  if (!data) {
    const err = response.error as { message?: string } | null;
    throw new Error(err?.message ?? 'Error creando sala de video');
  }

  return data;
}
