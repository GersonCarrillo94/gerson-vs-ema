import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { meetingId } = await req.json() as { meetingId: string };
    if (!meetingId) {
      return new Response(JSON.stringify({ error: 'meetingId requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dailyApiKey = Deno.env.get('DAILY_API_KEY');
    if (!dailyApiKey) {
      return new Response(JSON.stringify({ error: 'Daily.co no configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const roomName = `gve-${meetingId.slice(0, 8)}`;

    const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dailyApiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          max_participants: 2,
          enable_chat: false,
          enable_screenshare: false,
          // Expira en 8 horas desde ahora
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
        },
      }),
    });

    if (!dailyRes.ok) {
      const err = await dailyRes.text();
      console.error('Daily.co error:', err);
      return new Response(JSON.stringify({ error: 'Error creando sala de video' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const room = await dailyRes.json() as { name: string; url: string };

    return new Response(
      JSON.stringify({ roomName: room.name, roomUrl: room.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-daily-room error:', err);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
