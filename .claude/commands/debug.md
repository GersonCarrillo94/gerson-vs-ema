---
description: Diagnostica un bug sistemáticamente usando el método del debugger agent
---

# Comando: Debug sistemático

Usa este comando cuando algo no funciona y no es obvio por qué.

## Proceso

1. **Invoca al agente `debugger`** y pasa el contexto del problema.

2. **Recoge información del usuario** si falta:
   - ¿Qué intentaste hacer?
   - ¿Qué pasó (vs lo esperado)?
   - ¿Cuál es el error EXACTO (texto, screenshot, logs)?
   - ¿Cuándo empezó? ¿Funcionaba antes?
   - ¿Se reproduce consistentemente o intermitente?
   - ¿En qué browser / device / network?

3. **NO empieces a cambiar código** hasta:
   - Haber reproducido el bug
   - Haber formado al menos una hipótesis específica
   - Haber verificado la hipótesis con evidencia

4. **Documenta el proceso** mientras debuggeas:
   - Qué hipótesis probaste
   - Qué evidencia obtuviste
   - Por qué descartaste o confirmaste cada una

5. **Cuando encuentres el bug**:
   - Escribe un test que reproduzca el bug (que falla con código actual)
   - Aplica el fix mínimo necesario
   - Verifica que el test ahora pase
   - Verifica que NADA MÁS se rompió (`npm run test`, `npm run typecheck`)

6. **Commit**:
   ```
   fix(<scope>): <descripción específica del bug>

   <opcional: explicación del por qué del bug y por qué este fix funciona>
   ```

7. **Actualiza el checklist** con:
   - Bug encontrado y root cause
   - Fix aplicado
   - Test añadido
   - Cualquier patrón de bug que vale prevenir en el futuro

## Recuerda

- "Just try this" sin hipótesis es la receta para crear MÁS bugs
- Si después de 30 min sigues sin progreso, para y replantea
- A veces el bug está en tu suposición, no en el código
- Bugs intermitentes suelen ser race conditions, stale closures o state inconsistente

Ver `.claude/agents/debugger.md` para el método completo.
