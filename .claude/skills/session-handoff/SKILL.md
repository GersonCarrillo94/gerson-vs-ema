---
name: session-handoff
description: Use this skill at the END of every Claude Code session to create the handoff checklist. Ensures the next session can resume without losing context. Also use this at the START of a session to read the previous handoff.
---

# Skill: Session Handoff

## Cuándo usar este skill

- **Al INICIO de cada sesión**: leer el último `session-XXX.md` para entender desde dónde retomar.
- **Al FINAL de cada sesión**: crear o actualizar el `session-XXX.md` con el estado actual.

## Workflow al INICIAR sesión

```
1. Listar archivos en docs/checklists/
   → ls docs/checklists/session-*.md

2. Abrir el de mayor número (el más reciente)

3. Leer las secciones:
   - "Hecho hoy" (qué se completó)
   - "Pendiente para próxima sesión" (qué hacer ahora)
   - "Bloqueos / problemas sin resolver" (qué evitar o resolver primero)
   - "Cómo retomar" (comandos exactos)

4. Confirmar con el usuario:
   "El estado del último handoff era: [resumen 2 líneas].
    ¿Continuamos con [primera tarea pendiente]?"

5. Si el usuario confirma → crear nuevo session-XXX+1.md vacío con el header
6. Empezar a trabajar
```

## Workflow al FINALIZAR sesión

```
1. Verificar estado de git: git status
   → Si hay cambios sin commitear → preguntar al usuario si commitear

2. Generar nombre del archivo: session-XXX.md donde XXX = (último + 1)

3. Llenar la plantilla (basada en docs/checklists/TEMPLATE.md):
   - Título descriptivo
   - Fecha y duración
   - Fase del roadmap
   - Branch actual
   - Objetivo original
   - Hecho hoy (lista detallada)
   - Archivos creados/modificados
   - Pendiente (priorizado en alta/media/baja)
   - Bloqueos
   - Decisiones tomadas
   - Notas
   - Estado de git
   - Cómo retomar (con comandos específicos)

4. Guardar en docs/checklists/session-XXX.md

5. Hacer commit:
   git add docs/checklists/session-XXX.md
   git commit -m "chore: session XXX handoff"
```

## Cómo nombrar el archivo

Buscar el último número existente y sumar 1:

```bash
# Bash
last=$(ls docs/checklists/session-*.md 2>/dev/null | grep -oE '[0-9]+' | sort -n | tail -1)
next=$(printf "%03d" $((${last:-0} + 1)))
echo "docs/checklists/session-$next.md"
```

Si no hay ninguno → `session-001.md`.

## Plantilla a usar

Usar `docs/checklists/TEMPLATE.md` como base. Copiar y rellenar TODAS las secciones, incluso si están vacías (poner "Ninguno" o "—" en lugar de borrar la sección).

## La sección crítica: "Cómo retomar"

Esta es LA sección más importante. Si todo lo demás se pierde, esta sola debería bastar para continuar.

Debe incluir:

1. **Comandos exactos para arrancar**:
   ```bash
   git checkout <branch>
   git pull
   npm install  # si hay deps nuevas
   npm run dev
   ```

2. **El archivo y línea/función específica** desde donde retomar:
   > "Abrir `src/features/lessons/components/activities/Flashcards.tsx` línea 87, donde quedó la lógica de scoring sin terminar."

3. **La tarea exacta**:
   > "La siguiente tarea es implementar el botón 'Skip card' que aparece después de 3 segundos viendo la misma carta."

4. **Cualquier setup adicional**:
   > "Asegurarse de que el seed de Supabase esté aplicado: `npx supabase db reset`"

5. **Recordatorios de bloqueos** que pueden surgir:
   > "Si el realtime no funciona, verificar que el bucket `chat-uploads` esté creado en Supabase Dashboard → Storage."

## Calidad del checklist

Un buen checklist:

- Es escaneable en 30 segundos
- Tiene tareas concretas, no vagas ("Implementar X" no "Mejorar Y")
- Prioriza explícitamente lo pendiente
- Documenta decisiones que afectarán el futuro
- Incluye los comandos exactos para correr

Un mal checklist:

- Solo dice "seguir trabajando en chat"
- Sin nombres de archivos específicos
- Mezcla tareas con notas dispersas
- Sin priorización
- Sin contexto de qué quedó a medias

## Frecuencia de updates dentro de la sesión

- Al inicio: crear con secciones vacías
- A medida que se completa: marcar `[x]` en "Hecho hoy"
- Cuando aparece un blocker: anotar INMEDIATAMENTE (no esperar al final)
- Cuando se toma una decisión técnica: anotar mientras está fresca
- Al final: completar las secciones restantes

## Ejemplo de buena sección "Pendiente"

```markdown
### 🔴 Alta prioridad
- [ ] Terminar `useTypingIndicator` hook (líneas 24-40 de chat-realtime.ts).
      Falta el throttle de 1 seg en `broadcastTyping`.
- [ ] Resolver bug: los mensajes con caracteres especiales (emojis) no se muestran bien.
      Sospecho que es problema de encoding en el INSERT.

### 🟡 Media prioridad
- [ ] Añadir tests para `sendFileMessage` (al menos: file too large, file null).
- [ ] Refactorizar `MessageBubble` — tiene 180 líneas, debería dividirse en `MessageBody` y `MessageMeta`.

### 🟢 Baja prioridad
- [ ] Cambiar el color del badge de "leído" — Ema dijo que el azul actual es feo.
```

## Ejemplo de buena sección "Bloqueos"

```markdown
### 🚨 Bloqueos / problemas sin resolver

- **Problema**: La subida de archivos al bucket `chat-uploads` falla con error "Bucket not found"
  - **Contexto**: Funcionó ayer, hoy no. Probé con archivos pequeños también.
  - **Hipótesis**: Posible que el bucket se borrara al hacer `db reset` accidental.
  - **Acción sugerida**: Verificar en Supabase Dashboard → Storage que `chat-uploads` exista.
    Si no, recrear con los settings de `docs/database-schema.md`.

- **Pendiente decisión del usuario**: ¿implementar reactions a mensajes en Fase 4 o moverlo a Fase 6?
  Hablar mañana.
```

## Anti-patrones

- ❌ Saltarse el handoff "porque solo trabajé 30 minutos"
- ❌ Checklist genérico: "seguir desarrollando la app"
- ❌ Marcar tareas como hechas cuando NO están testeadas
- ❌ Dejar decisiones técnicas sin documentar
- ❌ No comitear el checklist (queda en local, se pierde)
- ❌ Borrar checklists antiguos para "limpiar"
- ❌ Empezar nueva sesión sin leer el último handoff

## Caso especial: sesión interrumpida abruptamente

Si la sesión se corta (Claude Code crashea, conexión cae), el siguiente arranque debe:

1. Buscar el último `session-XXX.md`
2. Si parece incompleto (no tiene "Cómo retomar" o falta git status), reconstruir desde:
   - `git log --since='X hours ago'` → qué se comiteó
   - `git diff` → qué quedó sin comitear
3. Crear un `session-XXX-recovery.md` documentando lo que se pudo recuperar
4. Pedir al usuario que confirme el estado antes de seguir
