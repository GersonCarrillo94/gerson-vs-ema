-- =============================================================
-- Migración 009: Tabla de mensajes y configuración de chat
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================

-- -------------------------------------------------------------
-- 1. Tabla messages
-- -------------------------------------------------------------
create table if not exists public.messages (
  id          uuid        primary key default gen_random_uuid(),
  sender_id   uuid        not null references public.users(id) on delete cascade,
  receiver_id uuid        not null references public.users(id) on delete cascade,
  type        text        not null default 'text'
                          check (type in ('text', 'image', 'video', 'file', 'sticker', 'emoji')),
  content     text        not null,
  file_name   text,
  file_size   integer,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_messages_conversation
  on public.messages (
    least(sender_id, receiver_id),
    greatest(sender_id, receiver_id),
    created_at desc
  );

create index if not exists idx_messages_unread
  on public.messages (receiver_id, read_at)
  where read_at is null;

-- -------------------------------------------------------------
-- 2. RLS
-- -------------------------------------------------------------
alter table public.messages enable row level security;

-- Ver: solo el remitente o el destinatario
create policy "messages_select" on public.messages
  for select using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

-- Insertar: solo si soy el remitente
create policy "messages_insert" on public.messages
  for insert with check (auth.uid() = sender_id);

-- Actualizar: solo el receptor puede marcar como leído
create policy "messages_update_read" on public.messages
  for update using (auth.uid() = receiver_id);

-- -------------------------------------------------------------
-- 3. Supabase Realtime — suscribirse a mensajes nuevos
-- -------------------------------------------------------------
alter publication supabase_realtime add table public.messages;

-- -------------------------------------------------------------
-- 4. Storage — bucket chat-uploads
--    El bucket se crea como público para simplificar.
--    Los URLs son opacos (UUIDs) así que no son descubribles.
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat-uploads', 'chat-uploads', true)
on conflict (id) do nothing;

-- RLS en storage: cualquier usuario autenticado puede subir
create policy "chat_uploads_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-uploads');

-- RLS en storage: acceso público de lectura (el bucket es público)
create policy "chat_uploads_select" on storage.objects
  for select using (bucket_id = 'chat-uploads');

-- --------------------------------------------------------
-- DOWN
-- drop policy if exists "chat_uploads_select" on storage.objects;
-- drop policy if exists "chat_uploads_insert" on storage.objects;
-- delete from storage.buckets where id = 'chat-uploads';
-- drop table if exists public.messages;
-- --------------------------------------------------------
