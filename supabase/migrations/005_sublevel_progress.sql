-- =============================================================
-- Migración 005: Tabla sublevel_progress
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- Tabla de progreso por subnivel
create table if not exists public.sublevel_progress (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.users(id) on delete cascade,
  sublevel_number   integer     not null check (sublevel_number between 1 and 36),
  status            text        not null default 'locked'
                                check (status in ('locked', 'active', 'completed')),
  score_earned      integer     not null default 0,
  attempts          integer     not null default 0,
  started_at        timestamptz,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, sublevel_number)
);

create index if not exists idx_progress_user
  on public.sublevel_progress(user_id);

create index if not exists idx_progress_status
  on public.sublevel_progress(user_id, status);

-- Trigger: actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_sublevel_progress_updated_at
  before update on public.sublevel_progress
  for each row execute function public.set_updated_at();

-- RLS
alter table public.sublevel_progress enable row level security;

-- El usuario puede leer, insertar y actualizar sus propias filas
create policy "progress_own" on public.sublevel_progress
  for all using (auth.uid() = user_id);

-- El partner puede VER el progreso del otro (solo lectura)
-- Usa get_my_partner_id() para evitar recursión RLS (ver migración 004)
create policy "progress_view_partner" on public.sublevel_progress
  for select using (
    user_id = public.get_my_partner_id()
  );

-- --------------------------------------------------------
-- DOWN
-- drop trigger if exists trg_sublevel_progress_updated_at on public.sublevel_progress;
-- drop table if exists public.sublevel_progress;
-- --------------------------------------------------------
