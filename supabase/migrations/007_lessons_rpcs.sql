-- =============================================================
-- Migración 007: RPCs para el sistema de lecciones
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- -------------------------------------------------------------
-- RPC 1: initialize_user_progress
-- Crea la fila del subnivel 1 (active) si el usuario no tiene
-- ningún progreso aún. Llamar al cargar LessonsMapPage.
-- -------------------------------------------------------------
create or replace function public.initialize_user_progress()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if not exists (
    select 1 from public.sublevel_progress where user_id = v_user_id
  ) then
    insert into public.sublevel_progress (user_id, sublevel_number, status)
    values (v_user_id, 1, 'active');
  end if;
end;
$$;

-- -------------------------------------------------------------
-- RPC 2: complete_sublevel
-- Marca el subnivel como completado, registra el score_event
-- y desbloquea el siguiente subnivel. Operación atómica.
--
-- Parámetros:
--   p_sublevel_number  — número del subnivel completado (1-36)
--   p_score_earned     — puntos obtenidos en esta sesión
--
-- Devuelve:
--   { success: bool, next_sublevel: int | null, error: text | null }
-- -------------------------------------------------------------
create or replace function public.complete_sublevel(
  p_sublevel_number integer,
  p_score_earned    integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid    := auth.uid();
  v_next         integer := p_sublevel_number + 1;
  v_points_award integer;
begin
  -- Validar que el subnivel está en estado 'active' para este usuario
  if not exists (
    select 1 from public.sublevel_progress
    where user_id = v_user_id
      and sublevel_number = p_sublevel_number
      and status = 'active'
  ) then
    return jsonb_build_object(
      'success', false,
      'error', 'sublevel_not_active'
    );
  end if;

  -- Calcular puntos según nivel (básico/intermedio/avanzado)
  v_points_award := case
    when p_sublevel_number between 1  and 12 then least(p_score_earned, 100)
    when p_sublevel_number between 13 and 24 then least(p_score_earned, 150)
    else                                          least(p_score_earned, 200)
  end;

  -- Marcar el subnivel como completado
  update public.sublevel_progress
  set status       = 'completed',
      score_earned = v_points_award,
      attempts     = attempts + 1,
      completed_at = now(),
      updated_at   = now()
  where user_id = v_user_id
    and sublevel_number = p_sublevel_number;

  -- Registrar el evento de puntos (dispara trigger → users.total_score)
  insert into public.score_events (user_id, event_type, points, metadata)
  values (
    v_user_id,
    'sublevel_complete',
    v_points_award,
    jsonb_build_object('sublevel_number', p_sublevel_number)
  );

  -- Desbloquear el siguiente subnivel (si existe)
  if v_next <= 36 then
    insert into public.sublevel_progress (user_id, sublevel_number, status)
    values (v_user_id, v_next, 'active')
    on conflict (user_id, sublevel_number) do update
      set status     = case
            when excluded.status = 'locked' then 'active'
            else public.sublevel_progress.status
          end,
          updated_at = now();
  end if;

  -- Actualizar last_activity_at en users
  update public.users
  set last_activity_at = now(), updated_at = now()
  where id = v_user_id;

  return jsonb_build_object(
    'success',       true,
    'points_earned', v_points_award,
    'next_sublevel', case when v_next <= 36 then v_next else null end
  );
end;
$$;

-- -------------------------------------------------------------
-- RPC 3: start_sublevel
-- Registra el inicio de un subnivel (started_at + attempts++)
-- Llamar al entrar a /lessons/:id
-- -------------------------------------------------------------
create or replace function public.start_sublevel(
  p_sublevel_number integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  update public.sublevel_progress
  set started_at = coalesce(started_at, now()),
      attempts   = attempts + 1,
      updated_at = now()
  where user_id = v_user_id
    and sublevel_number = p_sublevel_number
    and status = 'active';
end;
$$;

-- --------------------------------------------------------
-- DOWN
-- drop function if exists public.initialize_user_progress();
-- drop function if exists public.complete_sublevel(integer, integer);
-- drop function if exists public.start_sublevel(integer);
-- --------------------------------------------------------
