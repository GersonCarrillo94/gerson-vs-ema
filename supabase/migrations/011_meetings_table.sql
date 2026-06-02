-- ============================================================
-- Migration 011: Reuniones y cronómetro de minutos Daily.co
-- Created: 2026-06-01
-- Purpose: Tabla meetings para acordar sesiones de estudio y
--          meeting_timer para controlar consumo mensual de
--          minutos Daily.co (500 min/mes de tiempo real).
-- ============================================================

-- set_updated_at() ya existe desde migración 008. Se usa aquí también.

-- =================== UP ===================

-- -------------------------------------------------------------
-- 1. Tabla meetings
-- -------------------------------------------------------------
create table if not exists public.meetings (
  id                        uuid        primary key default gen_random_uuid(),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  created_by                uuid        not null references public.users(id) on delete cascade,
  partner_id                uuid        not null references public.users(id) on delete cascade,

  scheduled_at              timestamptz not null,
  duration_estimate_minutes integer     not null
                            check (duration_estimate_minutes in (15, 30, 45, 60, 90)),
  actual_duration_minutes   integer     check (actual_duration_minutes > 0),

  location                  text,
  is_video_call             boolean     not null default false,
  video_room_url            text,
  daily_room_name           text,

  topic                     text        not null check (length(topic) between 1 and 300),
  topic_category            text        not null
                            check (topic_category in (
                              'vocabulary', 'grammar', 'conversation',
                              'pronunciation', 'task', 'other'
                            )),
  notes                     text,

  status                    text        not null default 'pending'
                            check (status in (
                              'pending', 'confirmed', 'rejected',
                              'completed', 'missed', 'cancelled'
                            )),

  confirmed_at              timestamptz,
  completed_at              timestamptz,
  attended_by_creator       boolean,
  attended_by_partner       boolean
);

create trigger trg_meetings_updated_at
  before update on public.meetings
  for each row execute function public.set_updated_at();

create index if not exists idx_meetings_created_by
  on public.meetings (created_by, scheduled_at desc);

create index if not exists idx_meetings_partner
  on public.meetings (partner_id, scheduled_at desc);

create index if not exists idx_meetings_active
  on public.meetings (status)
  where status in ('pending', 'confirmed');

-- -------------------------------------------------------------
-- 2. Tabla meeting_timer
--    Cronómetro mensual compartido por la pareja.
--    Presupuesto: 500 min/mes (= 1000 min-participante Daily.co free tier).
--    user1_id < user2_id para unicidad canónica del par.
-- -------------------------------------------------------------
create table if not exists public.meeting_timer (
  id             uuid        primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  user1_id       uuid        not null references public.users(id) on delete cascade,
  user2_id       uuid        not null references public.users(id) on delete cascade,

  year_month     text        not null check (year_month ~ '^\d{4}-\d{2}$'),
  minutes_budget integer     not null default 500,
  minutes_used   integer     not null default 0 check (minutes_used >= 0),

  constraint meeting_timer_canonical_pair check (user1_id < user2_id),
  unique (user1_id, user2_id, year_month)
);

create trigger trg_meeting_timer_updated_at
  before update on public.meeting_timer
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- 3. Trigger: resolver resultado de reunión
--    - Inserta score_events para ambos usuarios según asistencia
--    - Descuenta minutos del cronómetro si fue videollamada completada
-- -------------------------------------------------------------
create or replace function public.resolve_meeting_outcome()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user1        uuid;
  v_user2        uuid;
  v_month        text;
  v_minutes      integer;
  v_creator_pts  integer;
  v_partner_pts  integer;
  v_creator_evt  text;
  v_partner_evt  text;
begin
  if new.status not in ('completed', 'missed') or old.status = new.status then
    return new;
  end if;

  v_creator_pts := case when coalesce(new.attended_by_creator, false) then 100 else -300 end;
  v_partner_pts := case when coalesce(new.attended_by_partner, false) then 100 else -300 end;
  v_creator_evt := case when coalesce(new.attended_by_creator, false) then 'meeting_attended' else 'meeting_missed' end;
  v_partner_evt := case when coalesce(new.attended_by_partner, false) then 'meeting_attended' else 'meeting_missed' end;

  insert into public.score_events (user_id, event_type, points, reference_id)
  values
    (new.created_by, v_creator_evt, v_creator_pts, new.id),
    (new.partner_id, v_partner_evt, v_partner_pts, new.id);

  if new.status = 'completed' and new.is_video_call and new.actual_duration_minutes is not null then
    v_user1   := least(new.created_by, new.partner_id);
    v_user2   := greatest(new.created_by, new.partner_id);
    v_month   := to_char(coalesce(new.completed_at, now()), 'YYYY-MM');
    v_minutes := new.actual_duration_minutes;

    insert into public.meeting_timer (user1_id, user2_id, year_month, minutes_used)
    values (v_user1, v_user2, v_month, v_minutes)
    on conflict (user1_id, user2_id, year_month)
    do update set
      minutes_used = public.meeting_timer.minutes_used + v_minutes,
      updated_at   = now();
  end if;

  return new;
end;
$$;

create trigger trg_meetings_resolve_outcome
  after update on public.meetings
  for each row execute function public.resolve_meeting_outcome();

-- -------------------------------------------------------------
-- 4. RLS — meetings
-- -------------------------------------------------------------
alter table public.meetings enable row level security;

create policy "meetings_select" on public.meetings
  for select using (auth.uid() in (created_by, partner_id));

create policy "meetings_insert" on public.meetings
  for insert with check (auth.uid() = created_by);

create policy "meetings_update" on public.meetings
  for update
  using  (auth.uid() in (created_by, partner_id))
  with check (auth.uid() in (created_by, partner_id));

-- No DELETE desde el cliente; usar status = 'cancelled'

-- -------------------------------------------------------------
-- 5. RLS — meeting_timer
-- -------------------------------------------------------------
alter table public.meeting_timer enable row level security;

create policy "meeting_timer_select" on public.meeting_timer
  for select using (auth.uid() in (user1_id, user2_id));

-- Escritura solo vía trigger (security definer) — no desde el cliente

-- -------------------------------------------------------------
-- 6. Realtime
-- -------------------------------------------------------------
alter publication supabase_realtime add table public.meetings;
alter publication supabase_realtime add table public.meeting_timer;

-- =================== DOWN ===================
-- drop trigger if exists trg_meetings_resolve_outcome on public.meetings;
-- drop function if exists public.resolve_meeting_outcome;
-- drop trigger if exists trg_meeting_timer_updated_at on public.meeting_timer;
-- drop table if exists public.meeting_timer;
-- drop trigger if exists trg_meetings_updated_at on public.meetings;
-- drop table if exists public.meetings;
