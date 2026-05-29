-- =============================================================
-- Migración 010: Vinculación de compañero
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- -------------------------------------------------------------
-- 1. Agregar campo phone a users
-- -------------------------------------------------------------
alter table public.users
  add column if not exists phone text;

-- -------------------------------------------------------------
-- 2. RPC: search_potential_partner
--    Busca usuarios disponibles (sin compañero) por nombre,
--    email o teléfono. Solo devuelve campos seguros.
-- -------------------------------------------------------------
create or replace function search_potential_partner(
  p_query  text,
  p_method text   -- 'name' | 'email' | 'phone'
)
returns table(
  id                uuid,
  display_name      text,
  language_learning text,
  avatar_url        text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    u.id,
    u.display_name,
    u.language_learning::text,
    u.avatar_url
  from public.users u
  where
    u.id <> auth.uid()
    and u.partner_id is null
    and case p_method
          when 'name'  then u.display_name ilike '%' || trim(p_query) || '%'
          when 'email' then u.email        ilike '%' || trim(p_query) || '%'
          when 'phone' then u.phone = trim(p_query)
          else false
        end
  limit 10;
end;
$$;

-- Solo usuarios autenticados pueden llamar esta función
revoke execute on function search_potential_partner(text, text) from anon, public;
grant  execute on function search_potential_partner(text, text) to authenticated;

-- -------------------------------------------------------------
-- 3. RPC: link_partner
--    Vincula mutuamente dos usuarios. Atómico — ambos quedan
--    enlazados en la misma transacción.
-- -------------------------------------------------------------
create or replace function link_partner(p_partner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_my_id         uuid := auth.uid();
  v_my_partner    uuid;
  v_their_partner uuid;
begin
  -- Verificar que el usuario actual no tenga compañero
  select partner_id into v_my_partner
  from public.users where id = v_my_id;

  if v_my_partner is not null then
    raise exception 'already_linked'
      using hint = 'Tu cuenta ya tiene un compañero vinculado.';
  end if;

  -- Verificar que el objetivo tampoco tenga compañero
  select partner_id into v_their_partner
  from public.users where id = p_partner_id;

  if v_their_partner is not null then
    raise exception 'partner_already_linked'
      using hint = 'Ese usuario ya tiene un compañero vinculado.';
  end if;

  -- No vincular consigo mismo
  if v_my_id = p_partner_id then
    raise exception 'self_link'
      using hint = 'No puedes vincularte contigo mismo.';
  end if;

  -- Vincular ambos en la misma transacción
  update public.users
  set partner_id = p_partner_id, updated_at = now()
  where id = v_my_id;

  update public.users
  set partner_id = v_my_id, updated_at = now()
  where id = p_partner_id;
end;
$$;

revoke execute on function link_partner(uuid) from anon, public;
grant  execute on function link_partner(uuid) to authenticated;

-- -------------------------------------------------------------
-- DOWN
-- alter table public.users drop column if exists phone;
-- drop function if exists search_potential_partner(text, text);
-- drop function if exists link_partner(uuid);
-- -------------------------------------------------------------
