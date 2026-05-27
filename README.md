# Gerson vs Ema 🏆

App de aprendizaje mutuo de idiomas entre dos personas. Gerson aprende inglés, Ema aprende español. Compiten, colaboran y se retan con un sistema de puntos, rachas y reuniones obligatorias.

---

## Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Estilos**: Tailwind CSS v3
- **Estado**: Zustand + TanStack Query
- **Backend**: Supabase (Auth + DB + Realtime + Storage)
- **Video**: Daily.co (Fase 5)

---

## Configuración inicial (primera vez)

### 1. Clonar e instalar

```bash
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (gratis)
2. Crea un nuevo proyecto → anota el nombre (ej: `gerson-vs-ema-dev`)
3. Espera ~2 minutos a que el proyecto se inicialice
4. Ve a **Project Settings → API** y copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
# Edita .env.local y pega tus credenciales reales de Supabase
```

### 4. Crear las tablas en Supabase

Ve a **Supabase Dashboard → SQL Editor** y ejecuta cada migración en orden:

```
supabase/migrations/001_users_table.sql
```

También desactiva la confirmación de email para desarrollo:
- **Authentication → Providers → Email** → desactiva "Confirm email"

### 5. Correr el servidor de desarrollo

```bash
npm run dev
# Abre http://localhost:5173
```

---

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run typecheck    # Verificar tipos TypeScript
npm run lint         # ESLint
npm run test         # Vitest

# Cuando tengas credenciales de Supabase, regenerar tipos:
npx supabase login
npx supabase gen types typescript --project-id <ID> > src/types/database.ts
```

---

## Estructura del proyecto

```
src/
├── components/        # UI reutilizable
│   ├── auth/          # AuthGuard
│   ├── layout/        # AppLayout
│   └── ui/            # Button, Input, Spinner...
├── features/          # Lógica de dominio
│   └── auth/          # hooks, services, types
├── lib/               # Clientes externos (supabase, logger)
├── pages/             # Vistas por ruta
├── store/             # Zustand stores
├── types/             # Tipos TypeScript globales
└── styles/            # CSS global
```

---

## Fases del proyecto

Ver [ROADMAP.md](ROADMAP.md) para el plan completo de 6 fases.

| Fase | Estado | Descripción |
|---|---|---|
| 1 — Fundación + Auth | 🟡 En progreso | Login, registro, sesiones, layout |
| 2 — Lecciones | 🔴 No iniciado | 36 subniveles, 3 tipos de actividad |
| 3 — Dashboard + Gamificación | 🔴 No iniciado | Puntos, rachas, badges |
| 4 — Chat | 🔴 No iniciado | Mensajes en tiempo real |
| 5 — Reuniones + Video | 🔴 No iniciado | Daily.co, penalidades |
| 6 — Pulido + Deploy | 🔴 No iniciado | PWA, Vercel, contenido completo |

---

## 📂 ¿Qué hay en este repo?

```
gerson-vs-ema/
├── CLAUDE.md                  ← Memoria principal (Claude lo lee automáticamente)
├── ROADMAP.md                 ← Plan completo de 6 fases
├── README.md                  ← Estás aquí
├── .env.example               ← Plantilla de variables de entorno
├── .gitignore
│
├── docs/                      ← Documentación de referencia
│   ├── architecture.md        ← Decisiones técnicas, diagramas
│   ├── database-schema.md     ← Tablas, RLS, migraciones
│   ├── conventions.md         ← Estilo de código
│   ├── learning-content.md    ← Estructura de lecciones
│   └── checklists/            ← Estado de cada sesión
│       ├── README.md
│       ├── TEMPLATE.md
│       └── session-001-example.md
│
└── .claude/                   ← Configuración de Claude Code
    ├── agents/                ← 11 agentes especializados
    │   ├── frontend-builder.md
    │   ├── backend-architect.md
    │   ├── auth-specialist.md
    │   ├── chat-realtime.md
    │   ├── lesson-designer.md
    │   ├── gamification-engineer.md
    │   ├── meetings-coordinator.md
    │   ├── video-call-integrator.md
    │   ├── qa-tester.md
    │   ├── code-reviewer.md
    │   └── debugger.md
    ├── skills/                ← 10 patrones reutilizables
    │   ├── react-component/SKILL.md
    │   ├── supabase-table/SKILL.md
    │   ├── supabase-rls/SKILL.md
    │   ├── tailwind-styling/SKILL.md
    │   ├── form-validation/SKILL.md
    │   ├── error-handling/SKILL.md
    │   ├── typescript-types/SKILL.md
    │   ├── session-handoff/SKILL.md
    │   ├── lesson-content/SKILL.md
    │   └── git-commit/SKILL.md
    └── commands/              ← 4 slash commands útiles
        ├── start-session.md   ← /start-session
        ├── end-session.md     ← /end-session
        ├── new-feature.md     ← /new-feature
        └── debug.md           ← /debug
```

---

## 🚀 Cómo empezar

### Paso 1: Copia este scaffolding a tu proyecto

Si aún no tienes el proyecto creado, coloca esta carpeta como raíz. Si ya tienes algo, fusiona los archivos en tu repo.

### Paso 2: Abre Claude Code en VS Code

Abre el proyecto en VS Code y lanza Claude Code (desde la barra lateral o `Cmd+Shift+P` → "Claude Code").

Claude Code detectará automáticamente:
- ✅ `CLAUDE.md` (lo carga en cada sesión)
- ✅ `.claude/agents/` (los agentes están disponibles)
- ✅ `.claude/skills/` (las skills se invocan automáticamente)
- ✅ `.claude/commands/` (los slash commands aparecen al escribir `/`)

### Paso 3: Inicia tu primera sesión

En la chat de Claude Code escribe:
```
/start-session
```

O simplemente:
```
Empecemos con la Fase 1 del roadmap.
```

Claude leerá el último checklist (o te dirá que no hay ninguno aún) y te guiará desde ahí.

### Paso 4: Al terminar, cierra la sesión

```
/end-session
```

Esto crea un checklist detallado en `docs/checklists/session-XXX.md` que la próxima sesión usará para retomar exactamente donde quedaste.

---

## 🎯 Filosofía del setup

Este scaffolding está diseñado para que Claude Code:

1. **Nunca se pierda de contexto** entre sesiones → checklists detallados
2. **Siga convenciones consistentes** → reglas en `CLAUDE.md` + `conventions.md`
3. **Use el agente correcto** para cada tarea → 11 agentes especializados
4. **Aplique patrones probados** → 10 skills con ejemplos completos
5. **No invente APIs ni pierda tiempo** → versiones de paquetes pinneadas
6. **Documente decisiones** → cada sesión deja huella

### Anti-patrones que este setup PREVIENE

- ❌ Claude inventa una API que no existe → resuelto con docs específicas
- ❌ Claude usa `any` para "salir del paso" → prohibido en CLAUDE.md
- ❌ Claude olvida configurar RLS → skill `supabase-rls` lo recuerda
- ❌ Claude pierde el contexto entre sesiones → checklists obligatorios
- ❌ Claude crea componentes inconsistentes → skill `react-component`
- ❌ Claude comitea secretos por error → `.gitignore` y reglas en CLAUDE.md
- ❌ Claude rompe el typecheck y no se da cuenta → pre-commit checklist

---

## 🛠️ Stack del proyecto

| Capa | Tech | Versión |
|---|---|---|
| Frontend | React + TypeScript + Vite | 18.3 / 5.5 / 5.4 |
| Estilos | Tailwind CSS | 3.4 |
| Routing | React Router | 6.26 |
| Estado | Zustand + React Query | 4.5 / 5.51 |
| Backend | Supabase (Auth + DB + Realtime + Storage) | 2.45 |
| Video | Daily.co | 0.69 |
| Tests | Vitest + Testing Library | 2.0 / 16.0 |
| Lint | ESLint + Prettier | 9.9 / 3.3 |
| Runtime | Node | 20 LTS |

Ver `CLAUDE.md` para la lista completa con versiones exactas.

---

## 📚 Documentación

| Archivo | Para qué sirve |
|---|---|
| `CLAUDE.md` | Memoria principal — Claude lo lee primero siempre |
| `ROADMAP.md` | 6 fases del desarrollo con DoD por fase |
| `docs/architecture.md` | Arquitectura, decisiones técnicas, justificaciones |
| `docs/database-schema.md` | Schemas SQL, RLS policies, migraciones |
| `docs/conventions.md` | Estilo de código completo |
| `docs/learning-content.md` | Estructura JSON de las lecciones |
| `docs/checklists/` | Historial sesión por sesión |

---

## ⚙️ Comandos útiles (una vez que tengas el código)

```bash
# Desarrollo
npm install
npm run dev              # arranca Vite en localhost:5173
npm run build            # build de producción
npm run preview          # previsualiza el build

# Calidad
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npm run test             # Vitest
npm run validate-lessons # valida contenido de lecciones

# Supabase (opcional CLI local)
npx supabase login
npx supabase init
npx supabase start       # arranca DB local
npx supabase db reset    # aplica migraciones + seed
npx supabase gen types typescript --project-id <id> > src/types/database.ts
```

---

## 🤝 Convención de commits

```
feat(lessons): add flashcard component
fix(auth): handle expired session redirect
chore: session 005 handoff
docs: update database schema
```

Ver `.claude/skills/git-commit/SKILL.md` para el formato completo.

---

## ❓ FAQ rápida

**¿Dónde están las credenciales de Supabase?**
En `.env.local` (no commiteado). Copia `.env.example` y rellena con tus valores reales.

**¿Cómo invoco un agente específico?**
En el chat de Claude Code: `@frontend-builder crea el componente UserCard` o simplemente describe la tarea y Claude elegirá el agente apropiado.

**¿Qué pasa si Claude se va por las ramas?**
Recuérdale: "Sigue las reglas de `CLAUDE.md`" o "Usa el skill `react-component` para esto".

**¿Puedo modificar los agentes o skills?**
Sí, son archivos markdown editables. Pero hazlo con cuidado — están afinados para evitar errores comunes.

**¿Cómo retomo el trabajo mañana?**
Abre VS Code → Claude Code → escribe `/start-session`. Claude leerá el último checklist y te dirá qué continuar.

---

## 📝 Licencia

Privado. Proyecto personal de Gerson y Ema.
