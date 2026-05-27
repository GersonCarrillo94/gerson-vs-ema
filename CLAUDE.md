# CLAUDE.md — Memoria del proyecto

> Este archivo se carga automáticamente al inicio de cada sesión de Claude Code.
> Mantenlo conciso. Los detalles van en `docs/`.

---

## 🎯 Proyecto: Gerson VS Ema

App de aprendizaje mutuo de idiomas entre 2 personas:
- **Gerson** aprende **inglés**
- **Ema** aprende **español**

La app combina aprendizaje gamificado (36 subniveles, 3 niveles), comunicación (chat + voz + video) y compromisos sociales (reuniones obligatorias) con un sistema de puntuación que premia constancia y penaliza inactividad.

---

## ⚠️ Reglas críticas (NO romper)

1. **SIEMPRE empieza la sesión leyendo `docs/checklists/`** — abre el archivo más reciente (`session-XXX.md`) antes de hacer cualquier cosa. Confirma con el usuario el estado actual antes de codificar.
2. **SIEMPRE termina la sesión creando/actualizando un checklist** — usa la skill `session-handoff`.
3. **NUNCA instales paquetes sin verificar la versión exacta** definida en `package.json` o en este archivo. Si el paquete no existe, pregunta antes de añadirlo.
4. **NUNCA edites archivos en `.claude/` salvo que el usuario lo pida explícitamente** — son configuración de agentes y skills.
5. **NUNCA hardcodees secrets**. Usa `.env.local` (gitignored) y `import.meta.env.VITE_*`.
6. **SIEMPRE escribe TypeScript estricto**. Nada de `any` sin comentario justificando. Usa los tipos en `src/types/`.
7. **SIEMPRE valida con el usuario antes de cambios destructivos** — borrar archivos, drop tables, migraciones.
8. **Prefiere editar antes que crear**. No crees archivos nuevos si puedes extender uno existente.
9. **Un commit por feature lógica completa**. Sigue el formato Conventional Commits (ver `docs/conventions.md`).
10. **Si dudas, pregunta**. No inventes APIs ni endpoints. Verifica en la documentación oficial o pregunta al usuario.

---

## 🧱 Stack tecnológico (versiones fijas)

```jsonc
{
  "frontend": {
    "react": "^18.3.1",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "react-router-dom": "^6.26.0",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.51.0"
  },
  "backend": {
    "@supabase/supabase-js": "^2.45.0"
  },
  "video": {
    "@daily-co/daily-js": "^0.69.0"
  },
  "dev": {
    "eslint": "^9.9.0",
    "prettier": "^3.3.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0"
  }
}
```

**Node**: 20.x LTS. **Package manager**: `npm` (no pnpm/yarn salvo que el usuario pida lo contrario).

---

## 📁 Estructura del proyecto

```
src/
├── components/        # UI reutilizable (Button, Card, Input, Avatar...)
│   ├── ui/            # Atómicos sin lógica de negocio
│   └── shared/        # Compuestos compartidos entre features
├── pages/             # Vistas (1 carpeta por ruta principal)
│   ├── auth/
│   ├── dashboard/
│   ├── lessons/
│   ├── chat/
│   ├── meetings/
│   └── partner/
├── features/          # Lógica de dominio por feature
│   ├── auth/          # hooks, services, types específicos de auth
│   ├── lessons/
│   ├── scoring/
│   ├── chat/
│   └── meetings/
├── hooks/             # Hooks genéricos (useDebounce, useLocalStorage)
├── store/             # Zustand stores
├── lib/               # Clients de servicios externos (supabase, daily)
├── types/             # Tipos globales TypeScript
├── utils/             # Helpers puros (formatDate, calculatePoints)
├── data/              # Contenido estático de lecciones (JSON)
├── styles/            # CSS global, tokens Tailwind
└── App.tsx
```

**Regla**: si un archivo solo se usa dentro de una feature, vive en `features/<nombre>/`. Si se usa en varias, sube a `components/` `hooks/` o `utils/`.

---

## 🗂️ Convenciones rápidas

- **Componentes**: PascalCase (`UserAvatar.tsx`). 1 componente por archivo.
- **Hooks**: camelCase con prefijo `use` (`useUserProgress.ts`).
- **Utils**: camelCase (`formatScore.ts`).
- **Types**: PascalCase con sufijo descriptivo (`UserProfile`, `LessonResult`).
- **Constantes**: SCREAMING_SNAKE_CASE (`MAX_DAILY_PENALTY`).
- **Carpetas**: kebab-case (`partner-progress/`).
- **Imports**: orden: 1) React, 2) librerías externas, 3) `@/` alias internos, 4) relativos.

Detalles completos en `docs/conventions.md`.

---

## 🔁 Workflow obligatorio por sesión

```
INICIO DE SESIÓN
  1. Lee docs/checklists/session-XXX.md (el más reciente)
  2. Confirma con el usuario: "El último estado dice X. ¿Continuamos desde ahí?"
  3. Si hay tareas "pendientes" → ataca esas primero
  4. Si hay bloqueos → resuélvelos antes de avanzar

DURANTE LA SESIÓN
  - Antes de cada feature nueva → consulta ROADMAP.md
  - Antes de tocar UI → usa skill react-component
  - Antes de tocar DB → usa skill supabase-table + supabase-rls
  - Antes de manejar errores → usa skill error-handling
  - Antes de commit → usa skill git-commit

FIN DE SESIÓN
  1. Usa skill session-handoff
  2. Crea docs/checklists/session-XXX+1.md
  3. Resume: hecho, pendiente, bloqueos, decisiones tomadas
  4. Haz commit con mensaje "chore: session XXX handoff"
```

---

## 🤖 Cuándo usar cada agente

Invócalos con `@<agent-name>` o deja que Claude Code los seleccione:

| Agente | Cuándo usarlo |
|---|---|
| `frontend-builder` | Crear/modificar componentes React, páginas, layout |
| `backend-architect` | Schemas Supabase, migraciones, índices, triggers |
| `auth-specialist` | Login, registro, sesiones, recuperar contraseña |
| `chat-realtime` | Chat en tiempo real, suscripciones, mensajería |
| `lesson-designer` | Crear contenido de lecciones, actividades, ejercicios |
| `gamification-engineer` | Sistema de puntos, rachas, badges, penalidades |
| `meetings-coordinator` | Panel de reuniones, agendar, confirmar, ausencias |
| `video-call-integrator` | Integración Daily.co, llamadas voz/video |
| `qa-tester` | Tests unitarios, e2e, casos edge |
| `code-reviewer` | Revisar código antes de merge |
| `debugger` | Diagnosticar bugs sistemáticamente |

---

## 📚 Comandos útiles

```bash
npm run dev          # Servidor de desarrollo (Vite)
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest
npm run test:ui      # Vitest con UI

# Supabase local (opcional)
npx supabase start
npx supabase db reset
npx supabase migration new <nombre>
```

---

## 🚫 Anti-patrones (NO hacer)

- ❌ `useEffect` con array vacío para fetch inicial → usa React Query
- ❌ Estado global para datos del servidor → usa React Query
- ❌ Zustand para estado local de un componente → usa `useState`
- ❌ Inline styles → usa Tailwind
- ❌ Magic numbers en código → constantes en `utils/constants.ts`
- ❌ Componentes >200 líneas → divide en subcomponentes
- ❌ Funciones >50 líneas → extrae helpers
- ❌ Importar de `../../../` → usa alias `@/`
- ❌ Console.log en código commiteado → usa el logger de `lib/logger.ts`
- ❌ Suprimir errores TypeScript con `@ts-ignore` → arréglalos o usa `@ts-expect-error` con comentario

---

## 🔐 Variables de entorno

Definidas en `.env.local` (NUNCA en git):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DAILY_DOMAIN=
VITE_DAILY_API_KEY=
```

`.env.example` SÍ va en git con valores vacíos como referencia.

---

## 📖 Documentación de referencia

- `ROADMAP.md` → Fases de desarrollo, deliverables, prioridades
- `docs/architecture.md` → Decisiones técnicas, diagramas de flujo
- `docs/database-schema.md` → Tablas, RLS policies, migraciones
- `docs/conventions.md` → Estilo de código completo
- `docs/learning-content.md` → Estructura del contenido educativo
- `docs/checklists/` → Estado de cada sesión de trabajo

---

## ✅ Antes de marcar una tarea como "hecha"

- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run lint` pasa sin warnings
- [ ] El componente/feature funciona en `npm run dev`
- [ ] Si tiene UI: probado en mobile (responsive)
- [ ] Si toca DB: las RLS policies están definidas
- [ ] Si es código crítico: hay al menos 1 test
- [ ] Commit hecho con mensaje convencional
- [ ] Checklist actualizado

---

**Última actualización de este archivo**: al iniciar el proyecto. Actualízalo si cambian decisiones de stack o reglas críticas.
