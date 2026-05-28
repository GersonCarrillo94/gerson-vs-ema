-- =============================================================
-- Migración 006: Tabla score_events + trigger total_score
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- Log inmutable de todos los cambios de puntaje
create table if not exists public.score_events (
  id          uuid    primary key default gen_random_uuid(),
  user_id     uuid    not null references public.users(id) on delete cascade,
  event_type  text    not null check (event_type in (
    'sublevel_complete',
    'level_complete',
    'streak_bonus_weekly',
    'no_study_penalty',
    'consecutive_no_study_penalty',
    'meeting_attended',
    'meeting_missed',
    'meeting_compensation',
    'first_try_bonus'
  )),
  points      integer not null,
  reference_id uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_events_user_date
  on public.score_events(user_id, created_at desc);

-- Trigger: cada insert en score_events actualiza users.total_score
create or replace function public.update_user_total_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set total_score  = total_score + new.points,
      updated_at   = now()
  where id = new.user_id;
  return new;
end;
$$;

create trigger trg_update_score
  after insert on public.score_events
  for each row execute function public.update_user_total_score();

-- RLS
alter table public.score_events enable row level security;

-- El usuario solo puede VER sus propios eventos (INSERT via RPC)
create policy "events_own" on public.score_events
  for select using (auth.uid() = user_id);

-- El partner puede ver los eventos del otro (solo lectura)
-- Usa get_my_partner_id() para evitar recursión RLS (ver migración 004)
create policy "events_partner" on public.score_events
  for select using (
    user_id = public.get_my_partner_id()
  );

-- NOTA: No hay policy de INSERT porque los inserts se hacen via
-- la función complete_sublevel() (SECURITY DEFINER), no directamente.

-- --------------------------------------------------------
-- DOWN
-- drop trigger if exists trg_update_score on public.score_events;
-- drop function if exists public.update_user_total_score();
-- drop table if exists public.score_events;
-- --------------------------------------------------------
