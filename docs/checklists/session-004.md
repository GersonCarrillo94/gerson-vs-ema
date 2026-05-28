# Sesión 004 — Fase 3 iniciada (Dashboard + gamificación)

> **Fecha**: 2026-05-28
> **Duración**: ~1h
> **Fase del roadmap**: Fase 3 — Dashboard + gamificación 🟡
> **Branch**: `master` · Commit: `fa28d1d`

---

## 🎯 Objetivo de la sesión

Implementar el dashboard real, sistema de rachas y la vista del compañero (Fase 3 del ROADMAP).

---

## ✅ Hecho hoy

### Verificación final Fase 2
- [x] Usuario completó subnivel 1 con score ≥ 70% manualmente ✅
- [x] Subnivel 2 se desbloqueó correctamente ✅
- [x] Fase 2 marcada como 🟢 en ROADMAP.md

### Supabase — migraciones
- [x] `008_streak_system.sql` — reemplaza `complete_sublevel` para actualizar
  `current_streak` / `longest_streak` + emite `streak_bonus_weekly` (+300 pts al múltiplo de 7)
- [x] Nueva función `apply_streak_penalties()` — penaliza por días sin estudiar

### Edge Function
- [x] `supabase/functions/daily-streak-check/index.ts` — llama a `apply_streak_penalties()` via service role
  - Pendiente: programar cron en Supabase Dashboard (`0 6 * * *`)

### Frontend — scoring feature
- [x] `src/features/scoring/types.ts` — `Level`, `ScoreEvent`, `MyScoreData`, `PartnerScoreData`
- [x] `src/features/scoring/utils/levelConfig.ts` — 7 niveles (Principiante→Maestro), `getLevelFromScore`, `getProgressInLevel`, `pointsToNextLevel`
- [x] `src/features/scoring/services/scoreService.ts` — `fetchMyScoreData`, `fetchPartnerScoreData`
- [x] `src/features/scoring/hooks/useScore.ts` — `useMyScore`, `usePartnerScore`, `useInvalidateScore`
- [x] `src/features/scoring/components/StreakBadge.tsx` — badge de racha (colores dinámicos por intensidad)
- [x] `src/features/scoring/components/LevelBadge.tsx` — badge de nivel con emoji y color
- [x] `src/features/scoring/components/ToastProvider.tsx` — sistema de toast custom (sin librería externa)

### Frontend — páginas
- [x] `src/pages/dashboard/DashboardPage.tsx` — reemplazado placeholder con:
  - Cabecera con avatar de iniciales + saludo
  - Stats row: Nivel (+ barra de progreso), Racha, Progreso subniveles
  - CTA "Continuar aprendiendo →" al próximo subnivel activo
  - Últimas 5 actividades con descripción legible y tiempo relativo
  - Resumen del compañero con link a `/partner`
- [x] `src/pages/partner/PartnerProgressPage.tsx` — reemplazado placeholder con:
  - Cabeceras TÚ vs COMPAÑERO con avatares
  - Tabla de comparación: nivel, racha, puntaje, subniveles, récord racha
  - Banner "¡Vas ganando por X pts!" o "¡Empatados!"
- [x] `src/App.tsx` — `<ToastProvider>` wrapping toda la app
- [x] `src/pages/lessons/SublevelPage.tsx` — toast "+N pts ganados!" al completar subnivel

---

## ⏳ Pendiente para próxima sesión

### 🔴 Alta prioridad

- [ ] **Ejecutar migración 008** en Supabase Dashboard → SQL Editor
  - Archivo: `supabase/migrations/008_streak_system.sql`
  - Verificar que `complete_sublevel` ahora actualiza la racha correctamente

- [ ] **Programar Edge Function daily-streak-check**
  - Supabase Dashboard → Edge Functions → Deploy `daily-streak-check`
  - Configurar cron: `0 6 * * *` (6am UTC)

- [ ] **Verificar Fase 3 DoD**:
  - [ ] Dashboard muestra datos reales (score, streak, actividad reciente)
  - [ ] Completar subnivel 2 → racha se incrementa a 1 (o 2 si es el mismo día)
  - [ ] `/partner` muestra comparación real (requiere que Ema tenga progreso)
  - [ ] Toast aparece al completar un subnivel

### 🟡 Media prioridad

- [ ] **Completar DoD Fase 3** — tareas aún sin implementar del ROADMAP:
  - [ ] Animación de celebración al subir de nivel (actualmente solo hay badge)
  - [ ] Toast cuando se pierden puntos (requiere comparar score_events al cargar)
  - [ ] Notificación visual cuando el compañero avanza (Realtime en Fase 4)

- [ ] **Contenido subniveles 7–12** (inglés y español) — pendiente desde Fase 2
- [ ] **Menú hamburguesa mobile** en AppLayout (sidebar oculto en mobile)
- [ ] **Regenerar tipos Supabase**: `npx supabase gen types typescript --project-id urmclfcektwqmbslaoli > src/types/database.ts`

### 🟢 Baja prioridad
- [ ] `npm run lint` — no ejecutado esta sesión
- [ ] Tests unitarios para `scoreService` y `levelConfig`
- [ ] Eliminar `playwright` de devDependencies si no se usa formalmente

---

## 🚨 Bloqueos conocidos

- **Migración 008 no ejecutada aún** — el streak NO se actualiza hasta que se ejecute en Supabase.
  Mientras tanto, `current_streak` siempre será 0 y el dashboard mostrará "Sin racha".

- **Edge Function no desplegada** — las penalidades automáticas NO aplican hasta deployarla y programar el cron.

- **Ema sin partner_id** — si `users.partner_id` no está configurado en ambas cuentas, el compañero no se ve en el dashboard ni en `/partner`. Verificar en Supabase Dashboard.

---

## 📌 Decisiones tomadas

1. **Toast custom sin librería** — `sonner` / `react-hot-toast` no estaban en el stack. Se construyó un sistema de ~50 líneas con contexto React + `setTimeout`. Reversible si se agrega la librería.

2. **Niveles: 7 rangos de puntos** — Principiante (0-299) hasta Maestro (4700+). Basados en sumar todos los subniveles con bonus de racha. A los ~36 subniveles completados (3600 pts base + bonuses) alcanzas nivel 6-7.

3. **`fetchMyScoreData` hace 3 queries en paralelo** — users + score_events + sublevel_progress. El hook `useMyScore` cachea 30s. El dashboard no hace queries adicionales (reusar el mismo queryKey).

4. **PartnerProgressPage necesita `partner_id` configurado** — si el usuario no tiene partner vinculado, muestra un placeholder. La vinculación se hace manualmente en la DB por ahora.

---

## 💡 Notas técnicas

- **`getLevelFromScore`** hace `[...LEVELS].reverse().find(...)` — evita tener ranges excluyentes y maneja correctamente `score >= 4700` (último nivel).
- **Streak bonus** solo se dispara si `v_last_date <> current_date` para evitar doble bonus cuando el usuario completa 2 subniveles el mismo día.
- **`usePartnerScore`** está habilitado solo cuando `user?.partner_id` es truthy — evita queries innecesarias.
- **`InitialsAvatar`** definida localmente en Dashboard y PartnerPage (no vale la pena extraerla a `components/ui` hasta que se use en más lugares).

---

## 📊 Métricas

- Archivos nuevos: 9
- Archivos modificados: 7
- `npm run typecheck`: ✅ limpio
- Commit: `fa28d1d`

---

## 🔄 Cómo retomar

```bash
cd "c:\Users\adelm\OneDrive\Desktop\Gerson vs Ema\gerson-vs-ema"
npm run dev
# Navegar a http://localhost:5174/
```

### Primera tarea: ejecutar migración 008
1. Abrir Supabase Dashboard → SQL Editor
2. Pegar y ejecutar el contenido de `supabase/migrations/008_streak_system.sql`
3. Verificar: completar subnivel → `users.current_streak` se incrementa

### Segunda tarea: verificar DoD Fase 3
1. Ir a `/` — ver dashboard con datos reales
2. Completar subnivel 2 → toast aparece → racha = 1
3. Ir a `/partner` — ver comparación (si Ema tiene cuenta activa)
4. Si todo pasa → marcar Fase 3 como 🟢 en ROADMAP.md

### Si falta Fase 3 DoD: tareas de ROADMAP.md no implementadas aún
- Animación al subir de nivel
- Las penalidades automáticas (requiere cron desplegado)
- El Realtime del compañero (Fase 4)
