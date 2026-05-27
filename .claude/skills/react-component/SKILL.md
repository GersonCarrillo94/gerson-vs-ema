---
name: react-component
description: Use this skill when creating a new React component. Provides the standard template, ordering, and rules for components in this project. Triggers when the task involves creating a new .tsx file with a component.
---

# Skill: React Component

## Cuándo usar este skill

Cualquier momento en que crees un archivo `.tsx` con un componente React nuevo en `src/components/`, `src/pages/` o `src/features/*/components/`.

## Template estándar

```tsx
// 1. IMPORTS — orden estricto: React → libs externas → @/internos → tipos → relativos
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { User } from '@/types/user';
import { localHelper } from './localHelper';

// 2. TIPOS — Props con interface
interface ComponentNameProps {
  required: string;
  optional?: number;
  onAction?: (value: string) => void;
}

// 3. COMPONENTE — named export, función nombrada
export function ComponentName({ required, optional = 0, onAction }: ComponentNameProps) {
  // 3a. Hooks de React PRIMERO
  const [state, setState] = useState<string>('');

  // 3b. Hooks de librerías
  const { data, isLoading, error } = useQuery({
    queryKey: ['key', required],
    queryFn: () => fetchSomething(required),
  });

  // 3c. Hooks propios
  const { user } = useAuth();

  // 3d. Side effects
  useEffect(() => {
    // ...
  }, [required]);

  // 3e. Derivaciones (valores calculados)
  const isOwner = user?.id === data?.userId;

  // 3f. Handlers
  const handleClick = () => {
    onAction?.(state);
  };

  // 3g. Early returns
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState message="No data" />;

  // 3h. Render principal
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{data.title}</h2>
      {isOwner && (
        <Button onClick={handleClick}>Edit</Button>
      )}
    </div>
  );
}
```

## Checklist antes de guardar

- [ ] Filename = nombre del componente (`UserCard.tsx` → `export function UserCard`)
- [ ] **Named export**, no `default export`
- [ ] Props con **interface**, no `type`
- [ ] Sin `any`. Si es realmente necesario → `unknown` + type guard
- [ ] Hooks SIEMPRE al inicio (regla de hooks)
- [ ] Loading state si hace fetch
- [ ] Error state si hace fetch
- [ ] Empty state si renderiza listas
- [ ] Sin lógica de negocio inline (extraer a hook o util)
- [ ] Tailwind only, sin `style={...}` ni CSS files
- [ ] Mobile-first responsive
- [ ] Sin `console.log` dejado
- [ ] Sin keys de array con index si los items pueden reordenarse

## Anti-patrones específicos a evitar

```tsx
// ❌ MAL: default export
export default function Foo() {}

// ✅ BIEN: named export
export function Foo() {}

// ❌ MAL: type para props
type Props = { name: string };

// ✅ BIEN: interface
interface FooProps { name: string }

// ❌ MAL: lógica de fetch dentro
function Foo() {
  const [data, setData] = useState();
  useEffect(() => { fetch('/api/x').then(r => r.json()).then(setData); }, []);
  // ...
}

// ✅ BIEN: hook dedicado
function Foo() {
  const { data } = useFooData();
  // ...
}

// ❌ MAL: div con onClick para algo que debe ser botón
<div onClick={handleClick}>Click me</div>

// ✅ BIEN: botón real
<button onClick={handleClick}>Click me</button>

// ❌ MAL: index como key cuando los items pueden cambiar
{items.map((item, i) => <Item key={i} {...item} />)}

// ✅ BIEN: ID estable
{items.map((item) => <Item key={item.id} {...item} />)}
```

## Decidir dónde vive el componente

```
¿Es atómico, sin lógica de negocio (Button, Input, Card)?
  → src/components/ui/

¿Se usa en 2+ features (UserBadge, ProgressBar)?
  → src/components/shared/

¿Solo se usa dentro de UNA feature (ChatBubble, LessonCard)?
  → src/features/<feature>/components/

¿Es una página completa (DashboardPage, LoginPage)?
  → src/pages/<feature>/
```

## Componente vs hook: ¿cuál crear?

- Si es **UI con lógica de presentación** → componente
- Si es **lógica reutilizable sin UI** → hook
- Si es **lógica para UN componente, no reutilizable** → función dentro del componente
- Si es **función pura sin estado** → util

## Componente largo: cuándo dividir

Si tu componente:
- Tiene >200 líneas → divide
- Tiene >5 useState → considera useReducer o dividir
- Tiene >3 niveles de anidación → extrae subcomponentes
- Tiene secciones claramente separables → cada sección es un subcomponente

Ejemplo de división:
```tsx
// Antes: ChatPage de 350 líneas
// Después:
function ChatPage() {
  return (
    <div>
      <ChatHeader />
      <ChatMessageList />
      <ChatInput />
    </div>
  );
}
```
