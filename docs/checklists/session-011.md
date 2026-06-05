# Sesión 011 — Deploy en producción, PWA y notificaciones push

> **Fecha**: 2026-06-04
> **Duración**: ~2h
> **Fase del roadmap**: Fase 6 — Deploy y producción
> **Branch**: master

---

## 🎯 Objetivo de la sesión

Completar la Fase 6: verificar deploy en Vercel, probar flujo completo en producción, implementar PWA e integrar notificaciones push para reuniones.

---

## ✅ Hecho hoy

- [x] Diagnóstico y corrección de variables de entorno en Vercel — `VITE_SUPABASE_ANON_KEY` estaba en "Preview" en vez de "Production"
- [x] Deploy en Vercel verificado y funcionando ✅
- [x] Login en producción probado — redirige correctamente al Dashboard ✅
- [x] Flujo completo de reuniones con dos cuentas reales (Gerson + Ema) ✅
- [x] Problema de Daily.co billing resuelto — método de pago añadido, videollamadas funcionando en prod ✅
- [x] PWA implementada:
  - `vite-plugin-pwa@1.3.0` instalado con estrategia `injectManifest`
  - Íconos generados desde SVG: 64px, 192px, 512px, maskable, apple-touch-icon, favicon.ico
  - Web manifest configurado (standalone, theme_color azul Gerson, short_name GvsE)
  - `index.html` actualizado con links de favicon/apple-touch-icon
- [x] Notificaciones push implementadas:
  - Tabla `push_subscriptions` creada en Supabase (migración 012)
  - Edge Function `send-push-notification` desplegada (usa `npm:web-push@3.6.7`)
  - Claves VAPID generadas y configuradas como secrets en Supabase
  - `VITE_VAPID_PUBLIC_KEY` añadida en Vercel Production
  - Hook `usePushNotifications` — solicita permiso 3s después del login
  - Notificación al partner al crear reunión
  - Notificación al creador al confirmar o rechazar reunión

### Archivos creados
- `public/logo.svg` + íconos PNG generados
- `pwa-assets.config.ts`
- `src/sw.ts` — service worker personalizado con push handler
- `src/features/notifications/services/pushService.ts`
- `src/features/notifications/hooks/usePushNotifications.ts`
- `supabase/migrations/012_push_subscriptions.sql`
- `supabase/functions/send-push-notification/index.ts`
- `docs/checklists/session-011.md`

### Archivos modificados
- `vite.config.ts` — estrategia injectManifest + manifest PWA
- `index.html` — favicon y apple-touch-icon actualizados
- `src/vite-env.d.ts` — añadida `VITE_VAPID_PUBLIC_KEY`
- `src/components/layout/AppLayout.tsx` — integrado `usePushNotifications`
- `src/features/meetings/services/meetingService.ts` — notificaciones en create/confirm/reject
- `src/features/meetings/hooks/useMeetings.ts` — pasa `created_by` a confirm/reject
- `package.json` / `package-lock.json` — `vite-plugin-pwa`, `@vite-pwa/assets-generator`, `web-push`

### Commits de la sesión
```
f36a635 feat(notifications): add Web Push notifications for meetings
f045f7e feat(pwa): add PWA support with service worker, manifest and app icons
```

---

## ⏳ Pendiente para próxima sesión

### 🟢 Baja prioridad (nice to have)
- [ ] Dark mode — verificar cobertura completa en todas las páginas (settings, partner, lecciones)
- [ ] Bundle size — chunk principal 644 kB; considerar lazy loading de rutas con `React.lazy()`
- [ ] Lighthouse score en producción — apuntar a >90 en Performance y PWA
- [ ] Dominio personalizado en Vercel (si se consigue uno)

---

## 🚨 Bloqueos / problemas sin resolver

Ninguno. La app está completamente funcional en producción.

---

## 📌 Decisiones tomadas

1. **Decisión**: Variables de entorno en Vercel deben estar en "Production", no en environments separados por variable.
   - **Razón**: confusión inicial — Vercel tiene "Environments" (Production/Preview/Dev) que son contextos de deploy, no contenedores de variables.

2. **Decisión**: VAPID private key va en Supabase Secrets, no en Vercel.
   - **Razón**: la clave privada solo la usa la Edge Function en el servidor; nunca debe estar en el cliente.

3. **Decisión**: `injectManifest` en lugar de `generateSW` para el service worker.
   - **Razón**: `generateSW` no permite handlers personalizados (push events). `injectManifest` inyecta el precache manifest en el SW custom.

---

## 📂 Estado de Git

```
# Branch
master — limpio, todo pusheado

# Últimos commits
f36a635 feat(notifications): add Web Push notifications for meetings
f045f7e feat(pwa): add PWA support with service worker, manifest and app icons
7d17053 chore: session 010 handoff

# Remote
origin → https://github.com/GersonCarrillo94/gerson-vs-ema.git (up to date)
```

---

## 🔄 Cómo retomar

La app está lista para usarse. Los próximos pasos son todos opcionales (mejoras de calidad):

1. `cd gerson-vs-ema && npm run dev`
2. Elegir uno de los pendientes de baja prioridad
3. Para bundle size: añadir `React.lazy()` + `Suspense` en `App.tsx` para las rutas
4. Para Lighthouse: abrir Chrome DevTools → Lighthouse → analizar https://gerson-vs-ema.vercel.app
