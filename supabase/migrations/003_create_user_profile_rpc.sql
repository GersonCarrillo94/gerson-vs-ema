-- =============================================================
-- Migración 003: RPC create_user_profile
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================
--
-- Por qué RPC en vez de INSERT directo del cliente:
--   El INSERT directo requiere una política RLS de INSERT en public.users.
--   Aunque técnicamente posible, es más frágil (depende del timing de la
--   sesión post-signUp). La RPC con SECURITY DEFINER corre con privilegios
--   de postgres, evitando RLS por completo y siendo 100% confiable.
--
-- Por qué no trigger en auth.users:
--   Supabase puede restringir la creación de triggers en esquemas
--   gestionados (auth.*) dependiendo del plan o configuración del proyecto.

create or replace function public.create_user_profile(
  p_display_name text,
  p_language_learning text
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_email   text;
begin
  -- Verifica que hay un usuario autenticado (auth.uid() lee el JWT del request)
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  -- Lee el email directamente de auth.users
  select email into v_email
  from auth.users
  where id = v_user_id;

  -- Inserta el perfil sin pasar por RLS (SECURITY DEFINER)
  insert into public.users (id, email, display_name, language_learning)
  values (v_user_id, v_email, p_display_name, p_language_learning);

  return json_build_object('success', true);
end;
$$;

-- --------------------------------------------------------
-- DOWN
-- drop function if exists public.create_user_profile(text, text);
-- --------------------------------------------------------
