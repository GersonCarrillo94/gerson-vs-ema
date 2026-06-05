-- Añade columna preferred_language a la tabla users para persistir la preferencia de idioma de la interfaz
alter table public.users
  add column if not exists preferred_language text not null default 'es'
  check (preferred_language in ('es', 'en'));
