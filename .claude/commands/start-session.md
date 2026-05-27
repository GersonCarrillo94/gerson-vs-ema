---
description: Lee el último checklist de sesión y resume el estado para retomar trabajo
---

# Comando: Iniciar sesión

Ejecuta SIEMPRE este comando al empezar a trabajar en una nueva sesión de Claude Code.

## Pasos a seguir

1. Listar archivos en `docs/checklists/` y encontrar el `session-XXX.md` con número más alto
2. Leerlo COMPLETO
3. Resumir al usuario en este formato:

```
📋 Última sesión: session-XXX (YYYY-MM-DD)

✅ Hecho:
[2-4 bullets de los logros principales]

⏳ Pendiente alta prioridad:
[3-5 bullets de tareas críticas pendientes]

🚨 Bloqueos:
[Solo si los hay; si no, "Ninguno"]

📌 Cómo retomar:
[Instrucciones específicas del checklist]

¿Continuamos con [primera tarea pendiente]? ¿O quieres hacer otra cosa?
```

4. **Esperar confirmación del usuario** antes de empezar a codificar
5. Una vez confirmado, crear `docs/checklists/session-XXX+1.md` vacío con el header completo siguiendo `docs/checklists/TEMPLATE.md`

## NO hacer

- No empezar a codificar sin leer el último checklist
- No asumir lo que hay que hacer sin confirmar
- No saltarte la creación del nuevo checklist
