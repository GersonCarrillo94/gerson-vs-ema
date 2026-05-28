/**
 * Edge Function: daily-streak-check
 *
 * Aplica penalidades de racha a todos los usuarios que no estudiaron hoy.
 * Debe ejecutarse una vez al día (recomendado: 06:00 UTC).
 *
 * Para programar en Supabase Dashboard:
 *   Dashboard → Edge Functions → daily-streak-check → Schedule
 *   Cron expression: "0 6 * * *"
 *
 * O via CLI:
 *   supabase functions deploy daily-streak-check
 *   supabase functions schedule daily-streak-check --cron "0 6 * * *"
 *
 * Variables de entorno requeridas (configuradas automáticamente en Supabase):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (_req: Request) => {
  try {
    const { data: penalized, error } = await supabase.rpc('apply_streak_penalties');

    if (error) {
      console.error('[daily-streak-check] Error:', error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = {
      success: true,
      penalized,
      timestamp: new Date().toISOString(),
    };

    console.log(`[daily-streak-check] Penalized ${penalized} users`);

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[daily-streak-check] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
