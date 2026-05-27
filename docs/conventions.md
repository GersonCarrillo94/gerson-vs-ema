# 📐 Convenciones de código

Reglas a seguir siempre. Si una regla no aplica para un caso, documentar el por qué en el código.

---

## Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componente React | PascalCase | `UserAvatar.tsx` |
| Hook | camelCase con `use` | `useUserProgress.ts` |
| Servicio | camelCase con `Service` | `lessonService.ts` |
| Util | camelCase | `formatScore.ts` |
| Type/Interface | PascalCase | `UserProfile`, `LessonResult` |
| Constante | SCREAMING_SNAKE | `MAX_DAILY_PENALTY` |
| Variable/función | camelCase | `currentUser`, `calculateStreak()` |
| Booleano | prefijo `is`/`has`/`can` | `isLoggedIn`, `hasCompleted`, `canEdit` |
| Carpeta | kebab-case | `partner-progress/` |
| Tabla DB | snake_case plural | `score_events` |
| Columna DB | snake_case | `created_at` |

---

## Estructura de un componente React

```tsx
// 1. Imports
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { User } from '@/types/user';

// 2. Types (props del componente)
interface UserCardProps {
  userId: string;
  onSelect?: (user: User) => void;
}

// 3. Componente (named export, no default)
export function UserCard({ userId, onSelect }: UserCardProps) {
  // 3a. Hooks de React primero
  const [isOpen, setIsOpen] = useState(false);
  
  // 3b. Hooks de librerías
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
  
  // 3c. Hooks propios
  const { currentUser } = useAuth();
  
  // 3d. Derivaciones
  const isCurrentUser = currentUser?.id === userId;
  
  // 3e. Handlers
  const handleClick = () => {
    if (user) onSelect?.(user);
  };
  
  // 3f. Early returns
  if (isLoading) return <Skeleton />;
  if (!user) return null;
  
  // 3g. Render
  return (
    <div className="...">
      ...
    </div>
  );
}
```

**Reglas**:
- Un componente por archivo
- Named exports (no `export default`) para mejor refactor
- Props tipadas con `interface`, no `type`
- Sin lógica de negocio dentro del componente (usar hooks)

---

## Orden de imports

```tsx
// 1. React y librerías core
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Librerías externas
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 3. Internos con alias @/
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';

// 4. Tipos (separados con `import type`)
import type { User, UserProfile } from '@/types/user';

// 5. Relativos (raros, solo si es del mismo feature)
import { LessonHeader } from './LessonHeader';

// 6. Assets / estilos
import logoUrl from '@/assets/logo.svg';
import './styles.css';
```

Configurar ESLint plugin `import/order` para enforcear esto.

---

## TypeScript

### Tipos vs Interfaces

- `interface` para objetos que pueden extenderse (props de componentes, modelos de dominio)
- `type` para uniones, tuplas, computed types

```ts
// Interface: modelo del dominio
interface User {
  id: string;
  email: string;
  displayName: string;
}

// Type: unión discriminada
type LessonState =
  | { status: 'locked' }
  | { status: 'active'; startedAt: Date }
  | { status: 'completed'; completedAt: Date; score: number };
```

### Strictness

`tsconfig.json` debe tener:
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

### `any` está prohibido

Si DE VERDAD necesitas `any`:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const externalLibThing = libFn() as any; // Razón: la lib no expone tipos
```

Mejor alternativa: `unknown` + type guard.

### Validación runtime con Zod

Para datos que vienen de Supabase, URL params, formularios:
```ts
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(50),
});

type User = z.infer<typeof UserSchema>;

// Al parsear:
const user = UserSchema.parse(rawData);
```

---

## Manejo de errores

Ver `.claude/skills/error-handling/SKILL.md` para el patrón completo. Resumen:

```ts
// En servicios
try {
  const { data, error } = await supabase.from('users').select();
  if (error) throw new AppError('FETCH_USERS_FAILED', error.message);
  return data;
} catch (err) {
  logger.error('fetchUsers', err);
  throw err;
}

// En componentes
const { data, error } = useQuery(...);
if (error) return <ErrorState error={error} />;
```

Nunca silenciar errores con `catch (e) {}`.

---

## Estilos (Tailwind)

### Reglas

- 100% Tailwind, 0% CSS custom (salvo `index.css` global)
- Si una clase se repite >3 veces → extraer a componente o `@apply` en CSS
- Ordenar clases con prettier-plugin-tailwindcss
- Mobile-first: empieza sin prefijo, añade `md:` / `lg:` para tamaños mayores

```tsx
// ❌ Mal
<div style={{ marginTop: 16 }}>...</div>

// ❌ Mal: clases inconsistentes
<div className="mt-4 p-2 bg-blue-500 rounded-lg shadow-md hover:shadow-lg transition-all">

// ✅ Bien: usa componente Button del design system
<Button variant="primary" size="md">Click</Button>
```

### Tokens de color del proyecto

Definir en `tailwind.config.js`:
```js
colors: {
  brand: {
    gerson: '#3B82F6',  // azul para Gerson
    ema: '#F59E0B',     // ámbar para Ema
  },
  level: {
    basic: '#3B82F6',
    intermediate: '#10B981',
    advanced: '#F59E0B',
  },
}
```

---

## Git: Conventional Commits

Formato:
```
<tipo>(<scope>): <descripción corta>

<cuerpo opcional explicando el "por qué">

<footer opcional: BREAKING CHANGE, refs #123>
```

Tipos:
- `feat`: nueva funcionalidad
- `fix`: bugfix
- `chore`: tareas de mantenimiento (deps, config)
- `docs`: solo documentación
- `style`: formato, no afecta lógica
- `refactor`: refactor sin cambio de comportamiento
- `test`: añadir/modificar tests
- `perf`: mejora de performance

Ejemplos:
```
feat(lessons): add flashcard activity component
fix(auth): handle expired session redirect
chore: bump supabase-js to 2.45
refactor(scoring): extract streak calculation to util
```

### Tamaño del commit

- 1 commit = 1 cambio lógico
- Si describiendo el commit usas "y" → divide en dos commits
- Si tocas >10 archivos y no es una migración masiva → probablemente debería ser varios commits

---

## Documentación inline

### Comentar el por qué, no el qué

```ts
// ❌ Mal: explica el qué obvio
// Incrementa el contador
counter++;

// ✅ Bien: explica el por qué
// Incrementamos antes del INSERT porque el trigger Postgres
// asume que el conteo ya está actualizado.
counter++;
```

### JSDoc para funciones públicas

```ts
/**
 * Calcula los puntos a otorgar por completar un subnivel.
 * Incluye bonus si es el primer intento.
 *
 * @param sublevelNumber 1-36, determina la dificultad
 * @param attempts número total de intentos (incluye el actual)
 * @returns puntos a sumar al usuario
 */
export function calculateSublevelPoints(sublevelNumber: number, attempts: number): number {
  // ...
}
```

---

## Tests

- Cada util pura debería tener test unitario
- Cada hook complejo debería tener test
- Componentes: solo testear los que tienen lógica visible (no buttons triviales)
- E2E: solo flujos críticos (login, completar lección, enviar mensaje)

Estructura de un test:
```ts
import { describe, it, expect } from 'vitest';
import { calculateSublevelPoints } from './calculateSublevelPoints';

describe('calculateSublevelPoints', () => {
  it('returns 100 for basic level on first try', () => {
    expect(calculateSublevelPoints(1, 1)).toBe(150); // 100 + 50 bonus
  });
  
  it('returns base points without bonus after first try', () => {
    expect(calculateSublevelPoints(1, 2)).toBe(100);
  });
});
```

---

## Accesibilidad

- Todo `<img>` con `alt`
- Botones reales con `<button>`, links con `<a>`. Nunca `<div onClick>`.
- Labels asociados a inputs (htmlFor)
- Contraste mínimo WCAG AA (4.5:1)
- Focus visible (no quitar el outline sin reemplazarlo)
- Lang attribute en `<html>` y en bloques de otro idioma
