-- =============================================================
-- Migración 001: Tabla users + RLS
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- Tabla pública de perfiles (extiende auth.users de Supabase)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  language_learning text not null check (language_learning in ('english', 'spanish')),
  partner_id uuid references public.users(id),
  avatar_url text,
  total_score integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_partner on public.users(partner_id);

-- --------------------------------------------------------
-- RLS
-- --------------------------------------------------------
alter table public.users enable row level security;

-- Cada usuario puede ver su propio perfil
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

-- Cada usuario puede ver el perfil de su partner
create policy "users_select_partner" on public.users
  for select using (
    id in (select partner_id from public.users where id = auth.uid())
  );

-- Cada usuario solo puede actualizar su propio perfil
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- --------------------------------------------------------
-- Trigger: actualizar updated_at automáticamente
-- --------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function update_updated_at_column();

-- --------------------------------------------------------
-- DOWN (para revertir si es necesario)
-- drop table if exists public.users cascade;
-- --------------------------------------------------------
