-- =============================================================
-- Migración 004: Fix recursión infinita en RLS de public.users
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================
--
-- Problema:
--   La política "users_select_partner" hacía un SELECT en public.users
--   dentro de su propia definición. Al ejecutarse, Supabase aplicaba RLS,
--   lo que volvía a evaluar la misma política → recursión infinita → HTTP 500.
--
-- Solución:
--   Reemplazar el subquery por una función SECURITY DEFINER que lee
--   public.users sin pasar por RLS, rompiendo la recursión.
--   El mismo patrón aplica a otras tablas con políticas de "partner".

-- 1. Eliminar la política recursiva
drop policy if exists "users_select_partner" on public.users;

-- 2. Función que devuelve el partner_id del usuario actual SIN activar RLS
create or replace function public.get_my_partner_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select partner_id from public.users where id = auth.uid()
$$;

-- 3. Recrear la política usando la función (sin recursión)
create policy "users_select_partner" on public.users
  for select using (
    id = public.get_my_partner_id()
  );

-- ============================================================
-- NOTA: Las políticas de las siguientes tablas tienen el mismo
-- patrón recursivo y deben corregirse cuando se creen (Fases 2-5):
--
--   sublevel_progress: "progress_view_partner"
--     user_id in (select partner_id from public.users ...)
--
--   score_events: "events_partner"
--     user_id in (select partner_id from public.users ...)
--
-- Solución: reemplazar el subquery por public.get_my_partner_id()
-- ============================================================

-- --------------------------------------------------------
-- DOWN
-- drop policy if exists "users_select_partner" on public.users;
-- drop function if exists public.get_my_partner_id();
-- Recrear la política original (con recursión) si fuera necesario.
-- --------------------------------------------------------
