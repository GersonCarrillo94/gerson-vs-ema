---
name: supabase-rls
description: Use this skill when configuring Row Level Security (RLS) policies on a Supabase table. RLS is REQUIRED for every table in this project. Provides policy templates, testing approach, and common patterns.
---

# Skill: Supabase RLS Policies

## Regla absoluta

**TODA tabla en `public` debe tener RLS habilitado.** Sin excepciones. Tabla sin RLS = datos públicos para cualquier usuario autenticado.

## Workflow

```
1. Crear tabla (skill supabase-table)
2. Habilitar RLS:        alter table ... enable row level security;
3. Empezar restrictivo:  política por defecto = todo denegado
4. Abrir solo lo necesario, una política por acción (SELECT, INSERT, UPDATE, DELETE)
5. Probar como usuario autenticado, como otro usuario, como anónimo
```

## Template completo

```sql
-- =============================================================
-- RLS para public.example_items
-- =============================================================

-- 1. Habilitar RLS
alter table public.example_items enable row level security;

-- 2. (opcional) Forzar RLS incluso para owner de la tabla
alter table public.example_items force row level security;

-- 3. Políticas por acción

-- SELECT: usuario ve solo sus propios items
create policy "example_items_select_own" on public.example_items
  for select
  using (auth.uid() = user_id);

-- INSERT: usuario solo puede insertar items propios
create policy "example_items_insert_own" on public.example_items
  for insert
  with check (auth.uid() = user_id);

-- UPDATE: usuario solo puede actualizar sus items
create policy "example_items_update_own" on public.example_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: usuario solo puede borrar sus items
create policy "example_items_delete_own" on public.example_items
  for delete
  using (auth.uid() = user_id);
```

## `using` vs `with check`

- **`using`**: filtro al LEER filas existentes (SELECT, UPDATE, DELETE)
- **`with check`**: validación de filas NUEVAS o MODIFICADAS (INSERT, UPDATE)

UPDATE usa AMBAS:
- `using` → qué filas existentes puedo modificar
- `with check` → cómo deben quedar después de la modificación

Ejemplo: permite ver mensajes que recibí, pero solo puedo marcarlos como leídos (no editar el texto):

```sql
create policy "messages_update_read_only" on public.messages
  for update
  using (auth.uid() = receiver_id)  -- solo mensajes que recibí
  with check (
    auth.uid() = receiver_id        -- después del update, sigo siendo receiver
    -- y solo cambia el campo read_at (no validable en política directamente; usar trigger)
  );
```

## Patrones específicos del proyecto

### Patrón: dato propio
```sql
create policy "<table>_own" on public.<table>
  for all using (auth.uid() = user_id);
```

### Patrón: dato compartido con partner
```sql
create policy "<table>_view_partner" on public.<table>
  for select
  using (
    user_id in (select partner_id from public.users where id = auth.uid())
  );
```

### Patrón: solo inserción (logs inmutables como `score_events`)
```sql
-- SELECT solo del usuario
create policy "score_events_select_own" on public.score_events
  for select using (auth.uid() = user_id);

-- Sin política UPDATE ni DELETE → el client no puede modificar
-- INSERT solo desde Edge Functions con service_role (que bypasea RLS)
```

### Patrón: entidades entre dos partes (mensajes, reuniones)
```sql
create policy "messages_select_involved" on public.messages
  for select
  using (auth.uid() in (sender_id, receiver_id));

create policy "messages_insert_as_sender" on public.messages
  for insert
  with check (auth.uid() = sender_id);
```

### Patrón: lectura pública, escritura propia (perfiles públicos)
```sql
create policy "profiles_select_all" on public.profiles
  for select using (true);  -- cualquiera puede leer

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
```

## Funciones útiles dentro de policies

| Función | Devuelve |
|---|---|
| `auth.uid()` | UUID del usuario autenticado (null si anónimo) |
| `auth.role()` | Rol: 'authenticated' o 'anon' |
| `auth.jwt()` | JWT completo como JSON |
| `auth.email()` | Email del usuario |

## Cómo probar RLS

### Desde SQL Editor (modo simulación)
```sql
-- Simular que somos el usuario X
set role authenticated;
set request.jwt.claim.sub = 'uuid-del-usuario-X';

-- Ahora cualquier select obedece RLS como si fueras ese usuario
select * from public.messages;

-- Para volver a admin
reset role;
```

### Desde la app
Crear un test:
```ts
import { createClient } from '@supabase/supabase-js';

describe('RLS: messages', () => {
  it("user A cannot see user B's private messages", async () => {
    const clientA = createClient(url, anonKey);
    await clientA.auth.signInWithPassword({ email: 'a@test', password: '...' });

    const { data } = await clientA.from('messages').select();
    expect(data?.every((m) => m.sender_id === userAId || m.receiver_id === userAId)).toBe(true);
  });
});
```

## Bypassing RLS legítimamente

A veces necesitas operaciones que NO obedezcan RLS (cron jobs, admin tasks). En esos casos:

- **Edge Functions** usan `SUPABASE_SERVICE_ROLE_KEY` → bypassean RLS
- **NUNCA usar service_role en el cliente**
- **Limitar quién puede llamar la Edge Function** verificando JWT manualmente o usando claims

```ts
// Edge Function con service role
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // ← bypassea RLS
);

// ¡PERO! Verificar quién está llamando
const authHeader = req.headers.get('Authorization');
const { data: { user } } = await supabase.auth.getUser(authHeader);
if (!user) return new Response('Unauthorized', { status: 401 });
```

## Errores comunes

- ❌ Habilitar RLS sin políticas → nadie puede leer NI escribir (incluido el owner)
- ❌ Política con `using (true)` por descuido → datos públicos
- ❌ Olvidar `with check` en INSERT → cualquier valor pasa
- ❌ Probar solo como admin → RLS solo aplica a `authenticated` y `anon`
- ❌ Confiar en RLS y NO validar en el cliente → mensaje de error feo
- ❌ Confiar en validación cliente y NO en RLS → seguridad agujereada
- ❌ Política demasiado permisiva por flojera → `for all using (true)`

## Checklist de release

Antes de marcar una tabla como "lista":

- [ ] `alter table ... enable row level security;` ejecutado
- [ ] Al menos una política SELECT
- [ ] Política INSERT con `with check`
- [ ] Política UPDATE con `using` + `with check`
- [ ] Política DELETE (o decisión consciente de NO permitir delete)
- [ ] Probado: usuario A puede acceder a SUS datos
- [ ] Probado: usuario A NO puede acceder a datos de B
- [ ] Probado: usuario anónimo (no logueado) no accede a nada (o solo a lo público intencional)
- [ ] Documentado en `docs/database-schema.md`
