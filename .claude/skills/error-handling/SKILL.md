---
name: error-handling
description: Use this skill whenever code can fail — Supabase calls, file uploads, network requests, parsing untrusted data. Provides the patterns for typed errors, user-facing messages, logging, and React Query integration.
---

# Skill: Error Handling

## Principios

1. **Nunca silencies un error** con `catch (e) {}`. Si lo "ignoras", al menos `console.warn` con contexto.
2. **Tipo el error** cuando puedas (`AppError` con códigos), no solo `Error` con mensajes string.
3. **Distingue 3 capas**: errores del backend (DB, API), errores de UI (validación), errores inesperados (bugs).
4. **Mensajes para humanos**, no técnicos. `"Email inválido"` no `"validation_failed: regex_mismatch"`.
5. **Log siempre, muestra a veces**. El error técnico va al log, el mensaje amable al usuario.

## Clase AppError personalizada

```ts
// src/lib/errors.ts
export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'FILE_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public cause?: unknown,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

// Convertir errores de Supabase a AppError
export function fromSupabaseError(error: { code?: string; message: string }): AppError {
  const code: ErrorCode =
    error.code === 'PGRST116' ? 'NOT_FOUND' :
    error.code === '42501' ? 'FORBIDDEN' :
    error.code === '23505' ? 'CONFLICT' :
    'INTERNAL_ERROR';
  return new AppError(code, error.message, error);
}

// Mensaje user-friendly desde un error
export function getReadableError(err: unknown): string {
  if (isAppError(err)) {
    switch (err.code) {
      case 'NETWORK_ERROR':
        return 'Problema de conexión. Verifica tu internet.';
      case 'UNAUTHORIZED':
        return 'Tu sesión expiró. Por favor inicia sesión otra vez.';
      case 'FORBIDDEN':
        return 'No tienes permiso para esta acción.';
      case 'NOT_FOUND':
        return 'No encontramos lo que buscabas.';
      case 'VALIDATION_ERROR':
        return err.message; // ya es user-friendly
      case 'CONFLICT':
        return 'Ya existe un registro con esos datos.';
      case 'FILE_TOO_LARGE':
        return 'El archivo es demasiado grande.';
      case 'RATE_LIMITED':
        return 'Demasiados intentos. Espera un momento.';
      default:
        return 'Algo salió mal. Intenta de nuevo en un momento.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}
```

## Logger simple

```ts
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: unknown;
  timestamp: string;
}

const isDev = import.meta.env.DEV;

function log(entry: LogEntry) {
  if (isDev) {
    const fn = entry.level === 'error' || entry.level === 'warn' ? console.warn : console.log;
    fn(`[${entry.level}] ${entry.message}`, entry.context ?? '', entry.error ?? '');
  } else {
    // En prod: mandar a Sentry, Logflare, o el servicio que uses
    // sentry.captureMessage(entry.message, { extra: entry.context });
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    log({ level: 'debug', message, context, timestamp: new Date().toISOString() }),
  info: (message: string, context?: Record<string, unknown>) =>
    log({ level: 'info', message, context, timestamp: new Date().toISOString() }),
  warn: (message: string, context?: Record<string, unknown>) =>
    log({ level: 'warn', message, context, timestamp: new Date().toISOString() }),
  error: (message: string, error?: unknown, context?: Record<string, unknown>) =>
    log({ level: 'error', message, error, context, timestamp: new Date().toISOString() }),
};
```

## Patrón en services

```ts
// src/features/lessons/services/lessonService.ts
import { supabase } from '@/lib/supabase';
import { AppError, fromSupabaseError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function fetchSublevels(userId: string) {
  try {
    const { data, error } = await supabase
      .from('sublevel_progress')
      .select('*')
      .eq('user_id', userId)
      .order('sublevel_number');

    if (error) throw fromSupabaseError(error);
    if (!data) throw new AppError('NOT_FOUND', 'No sublevels found');

    return data;
  } catch (err) {
    logger.error('fetchSublevels failed', err, { userId });
    throw err;  // re-throw para que React Query lo capture
  }
}
```

## Patrón en componentes con React Query

```tsx
function LessonsPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sublevels', user?.id],
    queryFn: () => fetchSublevels(user!.id),
    enabled: !!user,
  });

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <ErrorState
        message={getReadableError(error)}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState message="Aún no hay lecciones" />;
  }

  return <SublevelMap sublevels={data} />;
}
```

## Patrón en mutations

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';

function CompleteSublevelButton({ sublevelId }: { sublevelId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => completeSublevel(sublevelId),
    onSuccess: () => {
      toast.success('¡Subnivel completado!');
      queryClient.invalidateQueries({ queryKey: ['sublevels'] });
    },
    onError: (err) => {
      toast.error(getReadableError(err));
    },
  });

  return (
    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {mutation.isPending ? 'Guardando...' : 'Completar'}
    </Button>
  );
}
```

## Componente ErrorState

```tsx
// src/components/shared/ErrorState.tsx
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-6">
      <span className="text-3xl">⚠️</span>
      <p className="text-center text-red-800">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
```

## Error Boundary global

Captura errores no atrapados en render:

```tsx
// src/components/shared/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('Error boundary caught', error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="max-w-md text-center">
              <h1 className="text-2xl font-bold">Algo se rompió 😞</h1>
              <p className="mt-2 text-gray-600">
                Estamos en eso. Refresca la página para intentar de nuevo.
              </p>
              <Button
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Refrescar
              </Button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

Envolver el App entero:
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Toast notifications

```ts
// src/lib/toast.ts
// Usar la lib que prefieras (sonner es ligera y buena)
import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
};
```

## Anti-patrones

- ❌ `catch (e) { }` (silencia el error)
- ❌ `catch (e) { console.log(e) }` (solo en dev, no es manejo)
- ❌ `throw new Error('error')` (string genérico, sin contexto)
- ❌ Mostrar el `e.message` crudo de Supabase al usuario (técnico y feo)
- ❌ Try/catch alrededor de TODO el render del componente (oculta bugs)
- ❌ Sin retry mechanism para errores de red transitorios
- ❌ Toast de error en `useEffect` que se dispara dos veces en dev mode → mostrar 2 toasts

## Casos especiales

### Errores transitorios (network blips)
React Query reintenta 3 veces por defecto. Configurar `retry: false` para mutations que no son idempotentes.

### Errores 401 (sesión expirada)
Centralizar en un interceptor:
```ts
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    queryClient.invalidateQueries();
  }
});
```

### Errores en background tasks (Realtime, cron)
Logger sí, toast NO. El usuario no causó el error y no puede hacer nada al respecto.
