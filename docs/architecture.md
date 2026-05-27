# 🏛️ Arquitectura — Gerson VS Ema

## Visión de alto nivel

```
┌─────────────────────────────────────────────────┐
│                  CLIENTE (Browser)              │
│  React + TypeScript + Vite + Tailwind           │
│  ┌──────────────────────────────────────────┐  │
│  │ Pages → Features → Components → UI       │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ React Query (server state)               │  │
│  │ Zustand (UI state)                       │  │
│  └──────────────────────────────────────────┘  │
└──────────────┬─────────────────┬────────────────┘
               │                 │
       ┌───────▼────────┐  ┌─────▼───────┐
       │   Supabase     │  │  Daily.co   │
       │ ┌────────────┐ │  │  (video)    │
       │ │ Auth       │ │  └─────────────┘
       │ │ PostgreSQL │ │
       │ │ Realtime   │ │
       │ │ Storage    │ │
       │ │ Functions  │ │
       │ └────────────┘ │
       └────────────────┘
```

## Capas del cliente

### 1. UI primitives (`src/components/ui/`)
Componentes atómicos sin lógica de negocio. Solo presentación.
Ejemplos: `Button`, `Input`, `Card`, `Avatar`, `Modal`, `Toast`.

### 2. Shared components (`src/components/shared/`)
Componentes compuestos reutilizados en varias features.
Ejemplos: `UserBadge`, `ProgressBar`, `EmptyState`, `LoadingScreen`.

### 3. Features (`src/features/`)
Lógica de dominio agrupada por área. Cada feature tiene:
- `types.ts` — tipos TypeScript del dominio
- `services/` — comunicación con Supabase
- `hooks/` — React Query + Zustand
- `components/` — componentes específicos de esa feature
- `utils/` — helpers puros

### 4. Pages (`src/pages/`)
Ensamblan features y components en una vista completa.
**Regla**: las páginas NO contienen lógica de negocio. Solo ensamblan.

## Flujo de datos

```
USER ACTION (click)
    ↓
PAGE handler
    ↓
FEATURE hook (ej: useCompleteLesson)
    ↓
FEATURE service (ej: lessonService.complete)
    ↓
SUPABASE (DB write + score event)
    ↓
React Query invalidate cache
    ↓
COMPONENTS re-render con datos frescos
```

## Estado: ¿dónde vive cada cosa?

| Tipo de estado | Herramienta | Ejemplo |
|---|---|---|
| **Server state** (datos de DB) | React Query | Lista de lecciones, mensajes, progreso |
| **UI state global** (entre rutas) | Zustand | Tema, sidebar abierto/cerrado |
| **UI state local** (componente) | `useState` | Form fields, modal visible |
| **URL state** (compartible) | React Router params | `/lessons/:id`, filtros |
| **Server-derived state** | React Query selectors | Total de puntos calculado |

## Autenticación: ciclo de vida

```
1. App boots → supabase.auth.getSession()
2. Si hay sesión → set user en Zustand, render app
3. Si no hay sesión → redirect /login
4. Login → supabase.auth.signInWithPassword()
5. Supabase emite event SIGNED_IN → onAuthStateChange listener
6. Zustand actualiza user
7. AuthGuard deja pasar
```

## Realtime: cómo funciona el chat

```
1. ChatPage monta → useRealtimeChat() crea subscription
2. Supabase channel filtrado por conversation_id
3. Cualquier INSERT en messages → broadcast a clientes suscritos
4. Cliente recibe → React Query invalida cache → re-render
5. Componente desmonta → unsubscribe automático
```

## Score system: arquitectura

```
EVENT (completar lección, perder día, faltar reunión)
    ↓
INSERT en score_events (con tipo, puntos, ref_id)
    ↓
TRIGGER en Postgres recalcula users.total_score
    ↓
React Query invalida queryKey ['user', userId, 'score']
    ↓
UI muestra el nuevo total con animación
```

**Por qué eventos y no solo total**: trazabilidad. Si algo se ve raro, podemos revisar el historial exacto de cómo llegamos a ese puntaje.

## Decisiones técnicas tomadas

### ¿Por qué Supabase y no Firebase / backend custom?
- Free tier generoso para 2 usuarios
- PostgreSQL real (no NoSQL) → mejor para datos relacionales como progreso/scoring
- RLS nativo → seguridad sin escribir backend
- Realtime incluido
- Storage S3-compatible incluido

### ¿Por qué Zustand y no Redux / Context?
- Boilerplate mínimo
- Performance mejor que Context para updates frecuentes
- TypeScript-first
- Redux es overkill para esta escala

### ¿Por qué React Query?
- Caché automática
- Refetch en focus
- Optimistic updates
- Devtools excelentes
- Maneja loading/error states sin código manual

### ¿Por qué Daily.co y no WebRTC puro?
- API trivial vs WebRTC que requiere signaling server propio
- 10,000 minutos gratis/mes (más que suficiente para 2 personas)
- STUN/TURN incluido (atraviesa NAT sin configurar nada)
- Si se vuelve caro, migramos a WebRTC nativo en Fase 6

### ¿Por qué Vite y no Next.js?
- App es SPA, no necesita SSR
- Vite es más rápido en dev
- Menos magia, más control
- Deploy en Vercel funciona igual

## Performance: principios

1. **Lazy load de rutas**: cada página principal con `React.lazy`
2. **Imágenes**: WebP, `loading="lazy"`, dimensiones explícitas
3. **Listas largas**: virtualización (react-virtual) si pasan 50 items
4. **React Query**: `staleTime` de 30s para queries no críticas
5. **Bundle**: revisar tamaño con `vite-bundle-visualizer`

## Seguridad: principios

1. **Nunca confiar en el cliente**. Toda validación importante en RLS o Edge Functions.
2. **RLS por defecto restrictivo**: empezar denegando todo, abrir solo lo necesario.
3. **Storage**: buckets privados con signed URLs, nunca públicos sin razón.
4. **Secrets**: solo en `.env.local` o variables de entorno de Supabase Functions.
5. **Inputs del usuario**: sanitizar en frontend (UX) Y validar en backend (seguridad).
