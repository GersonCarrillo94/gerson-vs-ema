-- =============================================================
-- Migración 002: Trigger que crea el perfil al registrarse
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- Función que crea automáticamente el perfil en public.users
-- cuando Supabase Auth crea un nuevo usuario en auth.users.
--
-- Por qué SECURITY DEFINER:
--   El trigger corre en el contexto del INSERT en auth.users (servidor),
--   no en el contexto del cliente. SECURITY DEFINER le da privilegios del
--   owner de la función (postgres), saltando RLS. Sin esto necesitaríamos
--   una política INSERT en public.users expuesta al cliente, con riesgo de
--   que un usuario inserte un perfil con id ajeno.
--
-- raw_user_meta_data:
--   Los datos pasados en signUp({ options: { data: {...} } }) llegan aquí.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, language_learning)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'language_learning', 'english')
  )
  on conflict (id) do nothing;  -- idempotente: si ya existe no falla
  return new;
end;
$$;

-- Trigger: se activa después de cada nuevo usuario en auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- --------------------------------------------------------
-- DOWN
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();
-- --------------------------------------------------------
