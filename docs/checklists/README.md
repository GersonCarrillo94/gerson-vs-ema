# 📋 Sistema de checklists de sesión

## Propósito

Cada sesión de trabajo con Claude Code debe terminar con un archivo de checklist en esta carpeta. Esto permite que la siguiente sesión empiece exactamente donde la anterior terminó, sin perder contexto.

## Reglas

1. **Nombrado**: `session-XXX.md` donde XXX es número con ceros (`session-001.md`, `session-002.md`...)
2. **Una sesión = un archivo**. No mezclar varias sesiones en un solo archivo.
3. **Crear al inicio O al final**: lo ideal es crear el archivo apenas empezar, e ir editándolo al cerrar.
4. **NUNCA borrar checklists antiguos**. Son el historial del proyecto.
5. **El último checklist creado** es la fuente de verdad para la próxima sesión.

## Workflow por sesión

### Al INICIAR una sesión:

```
1. Claude lee el último checklist (session-XXX.md)
2. Confirma con el usuario: "El último estado fue X. ¿Empezamos por Y?"
3. Si el usuario aprueba, crea session-XXX+1.md con el bloque "En curso"
4. Trabaja
```

### Durante la sesión:

```
- Marca tareas como [x] a medida que se completan
- Anota decisiones tomadas en "Decisiones de la sesión"
- Si surge un blocker, anótalo INMEDIATAMENTE en "Bloqueos"
```

### Al CERRAR la sesión:

```
1. Verifica que el commit esté hecho (git status limpio)
2. Completa todas las secciones del checklist
3. Especialmente importante:
   - "Hecho hoy" con detalle
   - "Pendiente para próxima sesión" con prioridad
   - "Cómo retomar" con instrucciones claras
4. Haz commit: "chore: session XXX handoff"
```

## Plantilla

Ver `TEMPLATE.md` para la estructura completa que debe tener cada session-XXX.md.

## Ejemplo

`session-001-example.md` muestra un checklist completo simulado para que veas cómo debería verse al final de una sesión real.
