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
  const { data, error } = await supabase.functions.invoke<DailyRoom>('create-daily-room', {
    body: { meetingId },
  });

  if (error || !data) {
    throw new Error(error?.message ?? 'Error creando sala de video');
  }

  return data;
}
