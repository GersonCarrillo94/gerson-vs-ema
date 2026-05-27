# 🗄️ Esquema de base de datos

## Tabla: `users` (extiende `auth.users` de Supabase)

```sql
create table public.users (
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

create index idx_users_partner on public.users(partner_id);
```

### RLS

```sql
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
```

---

## Tabla: `sublevel_progress`

```sql
create table public.sublevel_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sublevel_number integer not null check (sublevel_number between 1 and 36),
  status text not null default 'locked' check (status in ('locked','active','completed')),
  score_earned integer not null default 0,
  attempts integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  unique (user_id, sublevel_number)
);

create index idx_progress_user on public.sublevel_progress(user_id);
create index idx_progress_status on public.sublevel_progress(user_id, status);
```

### RLS

```sql
alter table public.sublevel_progress enable row level security;

create policy "progress_own" on public.sublevel_progress
  for all using (auth.uid() = user_id);

-- Partner puede ver el progreso del otro (solo lectura)
create policy "progress_view_partner" on public.sublevel_progress
  for select using (
    user_id in (select partner_id from public.users where id = auth.uid())
  );
```

---

## Tabla: `score_events`

Log inmutable de todos los cambios de puntaje. Útil para auditoría y debug.

```sql
create table public.score_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null check (event_type in (
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
  points integer not null,
  reference_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_events_user_date on public.score_events(user_id, created_at desc);
```

### Trigger: recalcular total_score automáticamente

```sql
create or replace function update_user_total_score()
returns trigger as $$
begin
  update public.users
  set total_score = total_score + new.points,
      updated_at = now()
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_score
after insert on public.score_events
for each row execute function update_user_total_score();
```

### RLS

```sql
alter table public.score_events enable row level security;

create policy "events_own" on public.score_events
  for select using (auth.uid() = user_id);

create policy "events_partner" on public.score_events
  for select using (
    user_id in (select partner_id from public.users where id = auth.uid())
  );

-- Solo el servidor (Edge Functions) puede insertar
-- Service role bypassea RLS, así que no necesita policy de INSERT
```

---

## Tabla: `messages`

```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('text','image','video','file','sticker','emoji')),
  content text not null,
  file_name text,
  file_size integer,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on public.messages(
  least(sender_id, receiver_id),
  greatest(sender_id, receiver_id),
  created_at desc
);
```

### RLS

```sql
alter table public.messages enable row level security;

create policy "messages_select" on public.messages
  for select using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

create policy "messages_insert" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "messages_update_read" on public.messages
  for update using (auth.uid() = receiver_id);
```

### Realtime

```sql
alter publication supabase_realtime add table public.messages;
```

---

## Tabla: `meetings`

```sql
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  partner_id uuid not null references public.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  location text,
  is_video_call boolean not null default false,
  video_room_url text,
  notes text,
  status text not null default 'pending' check (status in (
    'pending', 'confirmed', 'rejected', 'completed', 'missed', 'cancelled'
  )),
  confirmed_at timestamptz,
  completed_at timestamptz,
  missed_by uuid references public.users(id),
  attended_by_creator boolean,
  attended_by_partner boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_meetings_users on public.meetings(created_by, partner_id);
create index idx_meetings_scheduled on public.meetings(scheduled_at);
create index idx_meetings_status on public.meetings(status);
```

### RLS

```sql
alter table public.meetings enable row level security;

create policy "meetings_view_involved" on public.meetings
  for select using (
    auth.uid() = created_by or auth.uid() = partner_id
  );

create policy "meetings_create" on public.meetings
  for insert with check (auth.uid() = created_by);

create policy "meetings_update_involved" on public.meetings
  for update using (
    auth.uid() = created_by or auth.uid() = partner_id
  );
```

---

## Storage buckets

### `avatars` (público)
```
RLS:
- INSERT: auth.uid() = owner
- UPDATE: auth.uid() = owner
- SELECT: público
```

### `chat-uploads` (privado, signed URLs)
```
RLS:
- INSERT: usuarios autenticados
- SELECT: solo si auth.uid() está en messages.sender_id o receiver_id
  para ese archivo
```

Estructura: `chat-uploads/{conversation_id}/{timestamp}_{filename}`

---

## Migraciones

Orden recomendado para implementar:

1. `001_users_table.sql`
2. `002_sublevel_progress.sql`
3. `003_score_events.sql`
4. `004_messages.sql`
5. `005_meetings.sql`
6. `006_storage_buckets.sql`
7. `007_realtime_setup.sql`

Cada migración debe ser idempotente (`create table if not exists` cuando aplique) y reversible (incluir un `DOWN` comentado).

---

## Datos seed para desarrollo

Crear `supabase/seed.sql` con:
- 2 usuarios de prueba (Gerson y Ema) linkeados como partners
- Progreso inicial: subnivel 1 en `active` para ambos
- Algunos mensajes de ejemplo
- Una reunión futura

**IMPORTANTE**: Nunca correr el seed en producción.

---

## Convenciones

- Todos los timestamps en `timestamptz` (timezone-aware)
- Todas las PKs son `uuid`
- Foreign keys siempre con `on delete cascade` o explícitamente decidido
- Nombres de tabla en plural, columnas en singular
- `created_at` y `updated_at` en cada tabla principal
- Enums via `check` constraints (más flexible que tipos enum nativos)
