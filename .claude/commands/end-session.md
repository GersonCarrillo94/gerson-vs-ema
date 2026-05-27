---
description: Cierra la sesión actual creando un checklist detallado de handoff
---

# Comando: Cerrar sesión

Usa este comando al final de la sesión para crear/completar el checklist y dejar todo listo para retomar.

## Pasos

1. **Verifica el estado de Git**:
   ```bash
   git status
   git log --oneline -10
   ```
   Si hay cambios sin comitear, pregunta al usuario si quiere comitearlos antes de cerrar.

2. **Determina el número de sesión**:
   ```bash
   ls docs/checklists/session-*.md
   ```
   El número de esta sesión es el último + 1 (o 1 si no hay ninguno).

3. **Crea/completa `docs/checklists/session-XXX.md`** siguiendo `docs/checklists/TEMPLATE.md`.

   Llena TODAS las secciones:
   - Título descriptivo de lo que se trabajó
   - Fecha (hoy)
   - Duración aproximada
   - Fase del roadmap actual
   - Branch actual de git
   - Objetivo original (qué se quería lograr al empezar)
   - Hecho hoy (lista detallada con paths de archivos)
   - Archivos creados / modificados
   - Migraciones DB ejecutadas (si aplica)
   - Pendiente para próxima sesión (priorizado: 🔴 alta / 🟡 media / 🟢 baja)
   - Bloqueos / problemas sin resolver (con hipótesis y siguiente acción)
   - Decisiones tomadas (con razón, implicación, reversibilidad)
   - Notas y aprendizajes
   - Estado de Git (branch, commits de la sesión)
   - **Cómo retomar (LA sección más importante)** — debe incluir:
     - Comandos exactos para arrancar
     - Archivo y línea específica donde retomar
     - Tarea siguiente concreta
     - Bloqueos potenciales a recordar

4. **Comitea el checklist**:
   ```bash
   git add docs/checklists/session-XXX.md
   git commit -m "chore: session XXX handoff"
   ```

5. **Recuerda al usuario** lo último: "Sesión XXX guardada. Próxima sesión, ejecuta `/start-session` para retomar."

## Calidad del checklist

Antes de cerrar, asegúrate de que la sección "Cómo retomar" sea tan específica que cualquier persona (o instancia de Claude) pueda continuar el trabajo sin contexto adicional.

Si la sección "Cómo retomar" dice algo vago como "seguir trabajando en chat", NO está lista. Especifica:
- Qué archivo (con path completo)
- Qué línea o función
- Qué problema específico se está resolviendo
- Comandos exactos para arrancar
