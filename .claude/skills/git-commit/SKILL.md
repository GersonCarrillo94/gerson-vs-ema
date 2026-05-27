---
name: git-commit
description: Use this skill BEFORE making a git commit. Provides the Conventional Commits format, scope conventions for this project, when to split commits, and the pre-commit checklist.
---

# Skill: Git Commit

## Cuándo usar este skill

Antes de CADA `git commit`. Sin excepciones.

## Formato: Conventional Commits

```
<tipo>(<scope>): <descripción corta>

<cuerpo opcional explicando el "por qué">

<footer opcional: BREAKING CHANGE, refs #123>
```

## Tipos válidos

| Tipo | Cuándo usar |
|---|---|
| `feat` | Nueva funcionalidad para el usuario |
| `fix` | Bugfix |
| `chore` | Mantenimiento (deps, configs, refactor de paths) |
| `docs` | Solo documentación (README, comments, docs/) |
| `style` | Formato, espacios, comas — no afecta lógica |
| `refactor` | Refactor sin cambio de comportamiento |
| `test` | Añadir o modificar tests |
| `perf` | Mejora de performance |
| `build` | Cambios en sistema de build (vite, package.json) |
| `ci` | Cambios en CI (workflows GitHub Actions) |
| `revert` | Revertir un commit previo |

## Scopes del proyecto

Usar scopes consistentes para que sea fácil filtrar el log:

| Scope | Cuándo |
|---|---|
| `auth` | Login, signup, sesiones, partner linking |
| `lessons` | Sistema de lecciones, contenido, actividades |
| `scoring` | Puntos, rachas, badges, penalidades |
| `chat` | Chat realtime, mensajes, uploads |
| `meetings` | Reuniones, agendamiento, asistencia |
| `video` | Videollamadas, Daily.co |
| `dashboard` | Página principal, métricas |
| `ui` | Componentes primitivos compartidos |
| `db` | Migraciones, schema, RLS |
| `deps` | Actualización de dependencias |
| `config` | Cambios de configuración (eslint, tsconfig, vite) |

Si no encaja en ninguno, omitir el scope: `feat: add global error boundary`.

## Descripción corta (el título)

Reglas:
- Máximo **72 caracteres**
- Empieza con verbo en **infinitivo** o **presente simple**, NO en pasado
  - ✅ `add flashcard component`
  - ❌ `added flashcard component`
- Sin punto final
- Sin mayúscula inicial (después del scope)
  - ✅ `feat(lessons): add flashcard component`
  - ❌ `feat(lessons): Add flashcard component`
- Específico, no vago
  - ✅ `fix(chat): handle empty file upload`
  - ❌ `fix(chat): fix bug`

## Ejemplos buenos

```
feat(auth): add password reset flow
fix(scoring): correct streak reset on midnight UTC
refactor(lessons): extract sublevel calculation to util
test(scoring): add edge cases for penalty calculation
docs: update database schema with meetings table
chore(deps): bump @supabase/supabase-js from 2.44 to 2.45
chore: session 005 handoff
perf(chat): memoize message list to avoid re-renders
build: switch to npm from pnpm
```

## Cuerpo del commit (cuando añadir)

Añadir cuerpo si:
- El cambio NO es obvio del título
- Hay una decisión técnica que vale documentar
- Hay un trade-off importante

Formato del cuerpo:
- Línea en blanco después del título
- Texto wrap a 72 caracteres
- Explica el **por qué**, no el **qué** (el qué se ve en el diff)

```
fix(meetings): prevent double-booking on same timeslot

Two users could create overlapping meetings if they clicked the
button within ~500ms. Added a 1-second debounce on the submit
handler. Also added a uniqueness check in the service layer
as a safety net.

Closes #42
```

## Cuándo dividir en múltiples commits

Si describiendo tu cambio usas la palabra "y" → probablemente son dos commits.

Ejemplo:
```
❌ feat(chat): add typing indicator and fix scroll bug
```

Mejor:
```
✅ feat(chat): add typing indicator
✅ fix(chat): scroll to bottom on new message
```

### Reglas
- 1 commit = 1 cambio lógico
- Si tocas >10 archivos para algo distinto a una migración masiva → probablemente son varios commits
- Si parte del cambio es refactor previo al feature → 2 commits: primero refactor, luego feat

## Pre-commit checklist

Antes de cada commit:

- [ ] `npm run typecheck` → sin errores
- [ ] `npm run lint` → sin errores (warnings OK temporalmente)
- [ ] `npm run test` → todos pasan (si hay tests para lo modificado)
- [ ] Sin `console.log` dejado en el código
- [ ] Sin `// TODO` sin issue asociado (si es TODO importante)
- [ ] Sin código comentado "por si acaso" (eliminar; git lo recuerda)
- [ ] Sin secrets, API keys, contraseñas hardcoded
- [ ] Sin paths absolutos de tu máquina local (`/Users/tu_nombre/...`)
- [ ] Si tocaste `package.json` → `package-lock.json` también está incluido
- [ ] Si tocaste DB → migración + types regenerados ambos incluidos

## Comandos típicos

```bash
# Ver qué cambió
git status
git diff               # unstaged
git diff --cached      # staged

# Stagear selectivamente
git add <archivo>      # archivo completo
git add -p             # interactivo, por hunks (¡muy útil!)

# Crear commit
git commit -m "feat(scope): mensaje corto"

# Commit con cuerpo (abre editor)
git commit

# Modificar el último commit (NO si ya fue pusheado)
git commit --amend

# Ver historial
git log --oneline -20
git log --oneline --graph --all
```

## Branching

Para features:
```bash
git checkout -b feat/<descripción-corta>
# ... trabajar y commitear ...
git push -u origin feat/<descripción-corta>
# ... abrir PR ...
```

Nombres de branch:
- `feat/<descripción>` para features
- `fix/<descripción>` para bugs
- `chore/<descripción>` para mantenimiento
- Todo en kebab-case, sin números/IDs (a menos que haya issue tracker)

## Cuándo NO commitear

- ❌ "WIP" / "trabajo en progreso" sin contexto
- ❌ Cuando el código no compila
- ❌ Cuando los tests están rotos (a menos que sea fix progresivo)
- ❌ Cuando hay 10+ cambios mezclados sin estructura → dividir primero

Si necesitas guardar progreso sin commitear:
```bash
git stash               # guardar temporal
git stash pop           # recuperar
git stash list          # ver stashes
```

## Special: commit final de sesión

Al cerrar sesión con Claude Code:
```
chore: session 005 handoff
```

Body opcional:
```
chore: session 005 handoff

Completed: lessons sublevel 1-4 content
Pending: implement word_order activity renderer
Blockers: none
```

## Anti-patrones

- ❌ `git commit -am "stuff"` (mensaje inútil)
- ❌ `Fix` / `Update` / `Changes` como mensaje
- ❌ Commits en pasado ("Added", "Fixed")
- ❌ Mensajes con emojis (algunos equipos los aceptan, en este proyecto no)
- ❌ Commits que mezclan refactor + feat
- ❌ `git push --force` a main (usar `--force-with-lease` y solo en feature branches)
- ❌ Comitear `node_modules/` o `.env.local`
- ❌ Comitear archivos con nombre `Untitled` o `New File`
- ❌ Commits enormes (>30 archivos sin razón clara)

## Hooks útiles (opcional, en Fase 6)

`.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run typecheck
```

`.husky/commit-msg`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1
```

Esto fuerza el formato sin depender de la disciplina del autor.
