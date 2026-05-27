---
name: typescript-types
description: Use this skill when defining TypeScript types, interfaces, or generics. Provides the patterns for domain models, API responses, discriminated unions, and how to handle untyped data from external sources.
---

# Skill: TypeScript Types

## Reglas

1. **`strict: true`** activado en `tsconfig.json`. Innegociable.
2. **`any` está prohibido** salvo con comentario justificando. Usa `unknown` y type guards.
3. **`interface` para objetos extensibles** (props, modelos de dominio). **`type` para uniones, tuplas, computed types**.
4. **Validación runtime con Zod** en cada borde (formularios, API responses, URL params, localStorage).
5. **Tipos generados automáticamente desde Supabase** con `supabase gen types`.

## Modelo de dominio: interface

```ts
// src/types/user.ts
export interface User {
  id: string;
  email: string;
  displayName: string;
  languageLearning: 'english' | 'spanish';
  partnerId: string | null;
  avatarUrl: string | null;
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## Variantes con discriminated union

Útil para estados con campos diferentes según el estado:

```ts
type LessonState =
  | { status: 'locked'; reason?: string }
  | { status: 'active'; startedAt: Date; progress: number }
  | { status: 'completed'; completedAt: Date; score: number; attempts: number };

function describeState(state: LessonState): string {
  switch (state.status) {
    case 'locked':
      return state.reason ?? 'Bloqueado';
    case 'active':
      return `Empezado, ${state.progress}% completo`;
    case 'completed':
      return `Completado con ${state.score} pts`;
  }
}
```

TypeScript hace narrowing automático según el discriminator.

## Generics

```ts
// Función genérica
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

// Hook genérico
function useStorage<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    try {
      return JSON.parse(stored) as T;  // ⚠️ idealmente con Zod
    } catch {
      return defaultValue;
    }
  });

  const set = (val: T) => {
    setValue(val);
    localStorage.setItem(key, JSON.stringify(val));
  };

  return [value, set];
}
```

## Utility types útiles

```ts
// Hacer todas las props opcionales
type PartialUser = Partial<User>;

// Hacer todas requeridas (quitar opcional)
type RequiredUser = Required<User>;

// Solo ciertos campos
type UserName = Pick<User, 'id' | 'displayName' | 'avatarUrl'>;

// Excluir ciertos campos
type UserPublic = Omit<User, 'email'>;

// Hacer ciertos campos opcionales (custom util)
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type UserDraft = WithOptional<User, 'id' | 'createdAt' | 'updatedAt'>;

// Readonly recursivo
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// Type guard helper
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
// Uso: const filtered = items.filter(isDefined);  → tipo correctamente narrow
```

## Tipos desde Supabase

Generar automáticamente:
```bash
npx supabase gen types typescript --project-id <id> > src/types/database.ts
```

Esto crea un tipo `Database` con todas las tablas tipadas. Usarlo:

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const supabase = createClient<Database>(url, key);
```

Y para usar tipos específicos:
```ts
import type { Database } from '@/types/database';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];
```

**Regenerar cada vez que cambies el schema.**

## Mapping de Supabase row → modelo de dominio

Supabase devuelve `snake_case`, queremos `camelCase` en el frontend:

```ts
// src/features/users/services/userService.ts
import type { Database } from '@/types/database';
import type { User } from '@/types/user';

type UserRow = Database['public']['Tables']['users']['Row'];

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    languageLearning: row.language_learning as 'english' | 'spanish',
    partnerId: row.partner_id,
    avatarUrl: row.avatar_url,
    totalScore: row.total_score,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchUser(id: string): Promise<User> {
  const { data, error } = await supabase.from('users').select().eq('id', id).single();
  if (error) throw error;
  if (!data) throw new Error('User not found');
  return rowToUser(data);
}
```

## Cuando `any` es tentador

### Datos de JSON externo
```ts
// ❌ MAL
const data = JSON.parse(jsonString) as any;
const name = data.name;  // ¡cualquier cosa!

// ✅ BIEN
const Schema = z.object({ name: z.string() });
const data = Schema.parse(JSON.parse(jsonString));
const name = data.name;  // tipo string garantizado
```

### Función de tercera parte sin tipos
```ts
// ❌ MAL
declare const externalFn: any;

// ✅ BIEN: declaración mínima
declare function externalFn(input: string): { result: number };

// O type assertion en el sitio:
const result = (externalFn as (input: string) => { result: number })('hello');
```

### Error desconocido en catch
```ts
try {
  // ...
} catch (err) {
  // err es `unknown` (TS 4.4+), no `any`

  // ✅ Type guard
  if (err instanceof Error) {
    console.log(err.message);
  }

  // ✅ Custom guard
  if (isAppError(err)) {
    console.log(err.code);
  }
}
```

## Module augmentation (extender tipos de librerías)

```ts
// src/types/global.d.ts

// Añadir variables a window
declare global {
  interface Window {
    __APP_VERSION__: string;
  }
}

// Añadir env vars de Vite
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DAILY_DOMAIN: string;
  readonly VITE_DAILY_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};  // necesario para que el archivo sea un módulo
```

## Estricidad recomendada

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

`noUncheckedIndexedAccess` añade `undefined` al acceder a arrays/objetos por índice. Más verboso pero más seguro.

## Anti-patrones

- ❌ `any` sin justificación
- ❌ `as` (type assertion) para silenciar errores. Validar con Zod en su lugar.
- ❌ `@ts-ignore` → usar `@ts-expect-error` con comentario explicando
- ❌ Tipos en JSDoc cuando puedes tener .ts
- ❌ `Function` como tipo (demasiado genérico) → usa `(...args: Args) => Return`
- ❌ `object` como tipo (demasiado genérico) → usa `Record<string, unknown>` o un type específico
- ❌ Type assertion al final de la cadena (`as User`) en lugar de validar
- ❌ Tipos diferentes para la misma entidad en distintas partes del código

## Convenciones de nombres

| Tipo | Convención | Ejemplo |
|---|---|---|
| Interface (modelo) | `PascalCase` | `User`, `Message` |
| Type alias | `PascalCase` | `UserRole`, `LessonState` |
| Generic | `T`, `K`, `V` o `TName` | `function map<TInput, TOutput>(...)` |
| Props | `<Component>Props` | `UserCardProps` |
| Event handler | `On<Event>` | `OnSubmit`, `OnClose` |
| Async result | `<Action>Result` | `LoginResult` |
| Unions | descriptivo | `LoadingStatus = 'idle' \| 'loading' \| 'success' \| 'error'` |

## Quick reference: `interface` vs `type`

| Caso | Preferir |
|---|---|
| Props de componente | `interface` |
| Modelo de dominio | `interface` |
| Unión discriminada | `type` |
| Tuple | `type` |
| Mapped types | `type` |
| Cuando vas a extender (`extends`) | `interface` |
| Cuando vas a hacer intersection (`&`) | `type` |
