---
description: Inicia una nueva feature siguiendo el workflow del proyecto
---

# Comando: Nueva feature

Usa este comando cuando vayas a implementar una feature nueva del roadmap.

## Pasos

1. **Identifica la feature** en `ROADMAP.md`. Pregunta al usuario cuál si no lo dice claramente.

2. **Crea una branch dedicada**:
   ```bash
   git checkout main
   git pull
   git checkout -b feat/<nombre-feature>
   ```

3. **Lee la documentación relevante** en este orden:
   - `CLAUDE.md` (reglas globales)
   - `docs/conventions.md` (convenciones de código)
   - `ROADMAP.md` sección de esta feature (qué incluye)
   - Si toca DB: `docs/database-schema.md`
   - Si tiene contenido: `docs/learning-content.md`

4. **Identifica los agentes apropiados**:
   - UI / componentes → `frontend-builder`
   - Schema / DB → `backend-architect`
   - Auth → `auth-specialist`
   - Chat → `chat-realtime`
   - Lecciones → `lesson-designer`
   - Puntos / rachas → `gamification-engineer`
   - Reuniones → `meetings-coordinator`
   - Video → `video-call-integrator`

5. **Divide la feature en sub-tareas** y comparte con el usuario antes de empezar. Ejemplo:

   ```
   Para implementar "Sistema de lecciones - Fase 2", propongo:

   1. [backend-architect] Crear tabla sublevel_progress con RLS
   2. [lesson-designer] Definir tipos TypeScript de Activity
   3. [lesson-designer] Crear contenido sublevel 1-3 como prueba
   4. [frontend-builder] Componente <SublevelCard>
   5. [frontend-builder] Página /lessons con mapa de los 36
   6. [lesson-designer] Implementar renderer de Flashcards
   7. [lesson-designer] Implementar renderer de MultipleChoice
   8. [lesson-designer] Implementar renderer de FillInBlank
   9. [frontend-builder] Página /lessons/:id que orquesta actividades
   10. [qa-tester] Tests E2E del flujo "completar sublevel 1"

   ¿Empezamos por (1)? ¿O ajustamos el orden?
   ```

6. **Trabaja sub-tarea por sub-tarea**, comiteando cada una cuando esté lista:
   ```bash
   git add <files>
   git commit -m "feat(<scope>): <descripción>"
   ```

7. **Actualiza el checklist** con el progreso a medida que avanzas.

8. **Al terminar la feature** (no la sesión):
   ```bash
   git push -u origin feat/<nombre>
   # Crear PR o merge directo a main
   ```

9. **Verifica el DoD** de la feature en `ROADMAP.md` antes de marcarla como completa.

## NO hacer

- No trabajar directamente en `main`
- No mezclar 2 features en una branch
- No empezar la siguiente feature sin haber completado el DoD de la actual
- No olvidar regenerar tipos TypeScript si cambió el schema
