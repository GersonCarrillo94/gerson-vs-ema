---
name: supabase-table
description: Use this skill when creating a new table in Supabase. Provides the migration template, naming conventions, required columns, and the post-migration steps. Triggers when working in supabase/migrations/.
---

# Skill: Supabase Table Creation

## Cuándo usar este skill

Cada vez que necesites crear una tabla nueva en la base de datos Supabase. SIEMPRE acompañar con el skill `supabase-rls` antes de marcar la tabla como completa.

## Naming convention

- **Tabla**: `snake_case`, **plural** (`users`, `messages`, `score_events`)
- **Columna**: `snake_case`, **singular** (`user_id`, `created_at`, `is_active`)
- **Migración**: `<YYYYMMDDHHMMSS>_<descripcion_snake>.sql`

## Template de migración

Guardar en `supabase/migrations/`. Comando para generar timestamp: `date +%Y%m%d%H%M%S`.

```sql
-- ============================================================
-- Migration: <descripción legible>
-- Created: YYYY-MM-DD HH:MM
-- Author: <opcional>
-- Purpose: <por qué existe este cambio>
-- ============================================================

-- =================== UP ===================
create table if not exists public.example_items (
  -- Required columns en TODA tabla principal
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Foreign keys
  user_id uuid not null references public.users(id) on delete cascade,

  -- Domain columns
  title text not null check (length(title) between 1 and 200),
  status text not null default 'active' check (status in ('active', 'archived')),
  metadata jsonb,

  -- Unique constraints (si aplica)
  unique (user_id, title)
);

-- Trigger para actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_example_items_updated_at
before update on public.example_items
for each row execute function public.set_updated_at();

-- Indexes (solo los que sirven a queries reales)
create index if not exists idx_example_items_user
  on public.example_items(user_id);

create index if not exists idx_example_items_status
  on public.example_items(user_id, status)
  where status = 'active';  -- partial index si filtras siempre por activos

-- =================== DOWN (comentado) ===================
-- drop trigger if exists trg_example_items_updated_at on public.example_items;
-- drop function if exists public.set_updated_at;
-- drop table if exists public.example_items;
```

## Columnas requeridas en CADA tabla

| Columna | Tipo | Default | Por qué |
|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | PK estándar |
| `created_at` | `timestamptz` | `now()` | Auditoría mínima |
| `updated_at` | `timestamptz` | `now()` | Si la fila puede modificarse |

## Tipos recomendados

| Caso | Usar | Evitar |
|---|---|---|
| Identificador | `uuid` | `serial`, `bigint` |
| Texto corto (<255) | `text` | `varchar(255)` (text es igual de eficiente) |
| Texto largo | `text` | |
| Booleano | `boolean` | `tinyint`, `0/1` |
| Fecha+hora con TZ | `timestamptz` | `timestamp` (sin TZ pierde info) |
| Solo fecha | `date` | |
| Cantidades enteras | `integer` o `bigint` | `numeric` (para enteros) |
| Decimales (dinero) | `numeric(10,2)` | `float`, `double` |
| Estructura libre | `jsonb` | `json` (jsonb es indexable) |
| Lista de strings | `text[]` (si pocos) | tabla separada (si muchos) |
| Enum | `text` + `check` constraint | tipo enum nativo (menos flexible) |

## Constraints útiles

```sql
-- Rango numérico
amount integer not null check (amount >= 0)

-- Longitud de string
title text not null check (length(title) between 1 and 200)

-- Enum via check
status text not null check (status in ('pending', 'active', 'archived'))

-- Email válido (regex básico)
email text not null check (email ~* '^[^@]+@[^@]+\.[^@]+$')

-- Fecha futura
scheduled_at timestamptz not null check (scheduled_at > now())

-- Unique compuesto
unique (user_id, sublevel_number)
```

## Foreign keys: comportamiento on delete

```sql
-- CASCADE: si se borra el padre, se borran los hijos (ej: si borras user, borras sus mensajes)
user_id uuid references users(id) on delete cascade

-- RESTRICT: impide borrar el padre si hay hijos (ej: no puedes borrar un país si hay ciudades)
country_id uuid references countries(id) on delete restrict

-- SET NULL: si se borra el padre, el FK queda null (ej: si borras team lead, ticket sigue sin asignado)
assigned_to uuid references users(id) on delete set null

-- NO ACTION (default): error si hay hijos. Casi nunca uses este.
```

Para este proyecto, regla general: **cascade** para datos del usuario (mensajes, progreso), **restrict** para entidades compartidas.

## Indexes: cuándo añadirlos

Añadir índice si:
- La columna aparece en `WHERE` de queries frecuentes
- La columna aparece en `JOIN`
- La columna aparece en `ORDER BY`
- La tabla tendrá >10,000 filas

NO añadir si:
- La tabla es pequeña (<1000 filas siempre)
- La columna casi nunca se filtra
- Es para "futuro uso teórico"

Índices compuestos: si filtras por A y luego ordenas por B → `(A, B)`.

## Después de crear una tabla

1. **Verificar que aplique localmente** (si usas Supabase CLI):
   ```bash
   npx supabase db reset
   ```
2. **Aplicar a Cloud**: copiar SQL al SQL Editor del dashboard, o usar `db push`
3. **Configurar RLS** (skill `supabase-rls`)
4. **Regenerar tipos TypeScript**:
   ```bash
   npx supabase gen types typescript --project-id <id> > src/types/database.ts
   ```
5. **Actualizar `docs/database-schema.md`** con el schema
6. **Considerar añadir seed data** en `supabase/seed.sql` para dev

## Errores comunes

- ❌ Olvidar habilitar RLS → tabla queda público escribible
- ❌ Tipos `varchar(n)` con n arbitrario → usar `text` + check si necesitas límite
- ❌ Sin `created_at` → imposible debuggear quién creó qué cuándo
- ❌ FK sin `on delete` explícito → comportamiento poco claro
- ❌ Migración no idempotente (`create table` sin `if not exists`) → rompe al re-ejecutar
- ❌ Index en cada columna → escrituras lentas
- ❌ `serial` como PK → no escala a multi-region, hay conflictos
