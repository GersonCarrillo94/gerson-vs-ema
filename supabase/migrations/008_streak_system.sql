-- =============================================================
-- Migración 008: Sistema de rachas (streak)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================
--
-- Cambios:
--   1. Reemplaza complete_sublevel para que actualice current_streak,
--      longest_streak y emita el bonus semanal de racha (+300 pts).
--   2. Nueva función apply_streak_penalties() — llamada diariamente
--      por la Edge Function daily-streak-check.

-- -------------------------------------------------------------
-- 1. complete_sublevel (reemplaza la versión de migración 007)
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
  v_last_date    date;
  v_cur_streak   integer;
  v_new_streak   integer;
begin
  -- Validar que el subnivel está en estado 'active'
  if not exists (
    select 1 from public.sublevel_progress
    where user_id = v_user_id
      and sublevel_number = p_sublevel_number
      and status = 'active'
  ) then
    return jsonb_build_object('success', false, 'error', 'sublevel_not_active');
  end if;

  -- Calcular puntos según nivel
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

  -- Registrar el evento de puntos (trigger → users.total_score)
  insert into public.score_events (user_id, event_type, points, metadata)
  values (
    v_user_id,
    'sublevel_complete',
    v_points_award,
    jsonb_build_object('sublevel_number', p_sublevel_number)
  );

  -- Desbloquear el siguiente subnivel si existe
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

  -- Leer valores actuales ANTES de actualizar (para calcular racha)
  select
    date_trunc('day', last_activity_at)::date,
    current_streak
  into v_last_date, v_cur_streak
  from public.users
  where id = v_user_id;

  -- Calcular nueva racha
  --   NULL  → primera actividad ever → racha = 1
  --   hoy   → ya estudió hoy → sin cambio en racha
  --   ayer  → continuidad → racha + 1
  --   más   → días perdidos → reset a 1
  v_new_streak := case
    when v_last_date is null              then 1
    when v_last_date = current_date       then coalesce(v_cur_streak, 1)
    when v_last_date = current_date - 1  then coalesce(v_cur_streak, 0) + 1
    else 1
  end;

  -- Actualizar stats del usuario
  update public.users
  set last_activity_at = now(),
      current_streak   = v_new_streak,
      longest_streak   = greatest(coalesce(longest_streak, 0), v_new_streak),
      updated_at       = now()
  where id = v_user_id;

  -- Bonus semanal: +300 pts cuando la racha llega a múltiplo de 7
  -- Solo si la racha aumentó (evitar doble bonus si ya estudió hoy)
  if v_new_streak % 7 = 0
     and v_new_streak > 0
     and (v_last_date is null or v_last_date <> current_date) then
    insert into public.score_events (user_id, event_type, points, metadata)
    values (
      v_user_id,
      'streak_bonus_weekly',
      300,
      jsonb_build_object('streak_days', v_new_streak)
    );
  end if;

  return jsonb_build_object(
    'success',       true,
    'points_earned', v_points_award,
    'new_streak',    v_new_streak,
    'next_sublevel', case when v_next <= 36 then v_next else null end
  );
end;
$$;

-- -------------------------------------------------------------
-- 2. apply_streak_penalties — llamada por la Edge Function diaria
--
-- Para cada usuario que no estudió HOY:
--   - Inserta evento 'no_study_penalty' (-50 pts, diario)
--   - Si lleva exactamente 3 días sin estudiar → -200 pts extra
--   - Resetea current_streak a 0 si todavía era > 0
--
-- Devuelve: número de usuarios penalizados
-- -------------------------------------------------------------
create or replace function public.apply_streak_penalties()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user       record;
  v_penalized  integer := 0;
  v_days_since integer;
begin
  for v_user in
    select id, last_activity_at, current_streak
    from public.users
    where last_activity_at is not null
      and date_trunc('day', last_activity_at)::date < current_date
  loop
    -- Días transcurridos desde la última actividad
    v_days_since := (current_date - date_trunc('day', v_user.last_activity_at)::date)::integer;

    -- Penalidad diaria por no estudiar
    insert into public.score_events (user_id, event_type, points, metadata)
    values (
      v_user.id,
      'no_study_penalty',
      -50,
      jsonb_build_object('days_since_last_activity', v_days_since)
    );

    -- Penalidad extra exactamente al 3er día consecutivo sin estudiar
    if v_days_since = 3 then
      insert into public.score_events (user_id, event_type, points, metadata)
      values (
        v_user.id,
        'consecutive_no_study_penalty',
        -200,
        jsonb_build_object('days_since_last_activity', v_days_since)
      );
    end if;

    -- Resetear racha si aún era positiva
    if v_user.current_streak > 0 then
      update public.users
      set current_streak = 0, updated_at = now()
      where id = v_user.id;
    end if;

    v_penalized := v_penalized + 1;
  end loop;

  return v_penalized;
end;
$$;

-- --------------------------------------------------------
-- DOWN
-- drop function if exists public.apply_streak_penalties();
-- Para revertir complete_sublevel a la versión 007, re-ejecutar
-- la migración 007_lessons_rpcs.sql completa.
-- --------------------------------------------------------
