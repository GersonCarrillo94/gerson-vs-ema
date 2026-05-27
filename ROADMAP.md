# 🗺️ ROADMAP — Gerson VS Ema

Plan completo de desarrollo en 6 fases. Cada fase tiene entregables claros, definición de "hecho" y dependencias explícitas.

**Estado global**: 🔴 No iniciado · 🟡 En progreso · 🟢 Completado

---

## Convenciones del roadmap

- Cada fase = aprox 1 semana de trabajo concentrado
- **DoD (Definition of Done)** = checkbox que debe estar 100% antes de pasar a la siguiente fase
- **Dependencias** = fases que deben estar completas antes
- **Agente sugerido** = quién debería liderar esa fase

---

## 🏗️ FASE 1 — Fundación y autenticación
**Estado**: 🔴 · **Duración estimada**: 1 semana · **Dependencias**: ninguna
**Agentes**: `frontend-builder`, `backend-architect`, `auth-specialist`

### Objetivo
Tener un proyecto funcional con login/registro real, sesiones persistentes, navegación protegida y layout base.

### Tareas
- [ ] Inicializar Vite + React + TypeScript con `npm create vite@latest`
- [ ] Configurar Tailwind CSS con los tokens del proyecto
- [ ] Configurar ESLint + Prettier con las reglas de `docs/conventions.md`
- [ ] Configurar paths absolutos `@/*` en `tsconfig.json` y `vite.config.ts`
- [ ] Crear estructura de carpetas (`src/components`, `src/pages`, etc.)
- [ ] Crear proyecto en Supabase Cloud (free tier)
- [ ] Definir tabla `users` con campos del schema
- [ ] Configurar Supabase Auth (email + password, sin confirmación inicial para dev)
- [ ] Crear `lib/supabase.ts` con el cliente tipado
- [ ] Crear página `/login` con formulario validado
- [ ] Crear página `/register` con flujo de selección de idioma a aprender
- [ ] Crear `<AuthGuard>` que redirige a `/login` si no hay sesión
- [ ] Crear layout principal con sidebar/topbar de navegación
- [ ] Implementar logout
- [ ] Configurar `.env.local` y `.env.example`
- [ ] Inicializar repo Git y primer commit

### Definition of Done
- ✅ `npm run dev` levanta sin errores
- ✅ Puedo registrarme con email + contraseña
- ✅ Puedo cerrar sesión y volver a entrar
- ✅ Las rutas protegidas redirigen a login si no hay sesión
- ✅ Refrescar la página mantiene la sesión
- ✅ `npm run typecheck` y `npm run lint` limpios
- ✅ README.md con instrucciones de setup

### Entregables (archivos clave)
```
src/lib/supabase.ts
src/features/auth/hooks/useAuth.ts
src/features/auth/services/authService.ts
src/components/auth/AuthGuard.tsx
src/pages/auth/LoginPage.tsx
src/pages/auth/RegisterPage.tsx
src/components/layout/AppLayout.tsx
src/types/user.ts
.env.example
README.md
```

---

## 🎓 FASE 2 — Sistema de lecciones (core educativo)
**Estado**: 🔴 · **Duración estimada**: 1 semana · **Dependencias**: Fase 1
**Agentes**: `lesson-designer`, `frontend-builder`, `backend-architect`

### Objetivo
Que el usuario pueda navegar por los 36 subniveles, abrir un subnivel, completarlo y guardar el progreso.

### Tareas
- [ ] Definir esquema JSON de una lección en `docs/learning-content.md`
- [ ] Crear tabla `sublevel_progress` en Supabase
- [ ] Crear contenido inicial (al menos subniveles 1–6 para inglés y español)
- [ ] Página `/lessons` con mapa visual de los 36 subniveles
- [ ] Componente `<SublevelCard>` con estados: locked/active/completed
- [ ] Página `/lessons/:id` que renderiza el subnivel según su tipo de actividad
- [ ] Implementar 3 tipos de actividad mínimo:
  - [ ] **Flashcards** (palabra → traducción + audio)
  - [ ] **Opción múltiple** (escoger respuesta correcta)
  - [ ] **Fill in the blank** (completar la frase)
- [ ] Sistema de avance: terminar subnivel desbloquea el siguiente
- [ ] Animación al completar un subnivel
- [ ] Guardar `sublevel_progress.status = 'completed'` en DB
- [ ] Guardar puntos ganados en tabla `score_events`

### Definition of Done
- ✅ Puedo ver los 36 subniveles, con los bloqueados visiblemente diferentes
- ✅ Solo puedo entrar al subnivel 1 al inicio
- ✅ Al completar el subnivel 1 se desbloquea el 2
- ✅ El progreso persiste tras recargar
- ✅ Funcionan los 3 tipos de actividad sin errores
- ✅ El contenido se carga dinámicamente desde `data/lessons/`

### Entregables
```
src/data/lessons/en/sublevel-01.json (y más)
src/data/lessons/es/sublevel-01.json (y más)
src/features/lessons/types.ts
src/features/lessons/hooks/useSublevels.ts
src/features/lessons/services/lessonService.ts
src/features/lessons/components/activities/Flashcards.tsx
src/features/lessons/components/activities/MultipleChoice.tsx
src/features/lessons/components/activities/FillInBlank.tsx
src/pages/lessons/LessonsMapPage.tsx
src/pages/lessons/SublevelPage.tsx
```

---

## 📊 FASE 3 — Dashboard + gamificación
**Estado**: 🔴 · **Duración estimada**: 1 semana · **Dependencias**: Fase 2
**Agentes**: `gamification-engineer`, `frontend-builder`

### Objetivo
Dashboard funcional con métricas reales, sistema de puntos completo, rachas calculadas y vista del progreso del compañero.

### Tareas
- [ ] Dashboard `/` con:
  - [ ] Nivel actual y barra de progreso global
  - [ ] Puntaje total
  - [ ] Racha actual (días consecutivos)
  - [ ] Últimas 3 actividades
  - [ ] CTA "Continuar aprendiendo" → al próximo subnivel
- [ ] Implementar cálculo de racha (Edge Function diaria en Supabase)
- [ ] Implementar penalidades:
  - [ ] -50 pts por día sin estudiar
  - [ ] -200 pts adicionales al 3er día seguido
  - [ ] Reset de racha a 0
- [ ] Bonus de racha (+300 pts semanales)
- [ ] Sistema de badges según puntaje total
- [ ] Página `/partner` con progreso del otro usuario:
  - [ ] Nivel y subnivel actual
  - [ ] Racha
  - [ ] Puntaje
  - [ ] Comparación lado a lado
- [ ] Toast/notificación cuando ganas o pierdes puntos
- [ ] Animación de celebración al subir de nivel

### Definition of Done
- ✅ Dashboard refleja datos reales de la DB
- ✅ La racha se incrementa correctamente al estudiar 1 vez por día
- ✅ La racha se rompe si paso un día sin estudiar
- ✅ Las penalidades se aplican automáticamente
- ✅ Veo el progreso real de mi compañero en `/partner`
- ✅ Los badges aparecen correctamente según el rango de puntos

### Entregables
```
src/pages/dashboard/DashboardPage.tsx
src/pages/partner/PartnerProgressPage.tsx
src/features/scoring/services/scoreService.ts
src/features/scoring/hooks/useScore.ts
src/features/scoring/utils/calculateStreak.ts
src/features/scoring/utils/calculatePenalty.ts
src/features/scoring/components/StreakBadge.tsx
src/features/scoring/components/LevelBadge.tsx
supabase/functions/daily-streak-check/index.ts
supabase/migrations/<timestamp>_score_system.sql
```

---

## 💬 FASE 4 — Chat en tiempo real
**Estado**: 🔴 · **Duración estimada**: 1 semana · **Dependencias**: Fase 1
**Agentes**: `chat-realtime`, `frontend-builder`

### Objetivo
Chat funcional entre los 2 usuarios con texto, emojis, stickers, imágenes y archivos. Mensajes en tiempo real con Supabase Realtime.

### Tareas
- [ ] Crear tabla `messages` con RLS (solo sender/receiver pueden ver)
- [ ] Configurar Supabase Storage con bucket `chat-uploads`
- [ ] Página `/chat` con:
  - [ ] Lista de mensajes en orden cronológico
  - [ ] Input de texto en la parte inferior
  - [ ] Botón emoji picker
  - [ ] Botón adjuntar imagen/video/archivo
  - [ ] Subscripción Realtime para mensajes nuevos
- [ ] Indicador "escribiendo..." (presence)
- [ ] Marcar mensajes como leídos
- [ ] Manejo de archivos:
  - [ ] Validar tamaño máximo (10MB imagen, 50MB video, 25MB archivo)
  - [ ] Generar preview de imagen
  - [ ] Player de video inline
- [ ] Set de stickers (8-12 iniciales) como SVG o emoji compuesto
- [ ] Scroll automático al último mensaje
- [ ] Indicador de mensajes no leídos en la navegación

### Definition of Done
- ✅ Envío mensaje desde Gerson → llega instantáneamente a Ema
- ✅ Puedo enviar emoji, sticker, imagen, video, archivo
- ✅ Las imágenes se ven en el chat (no solo link)
- ✅ Los archivos se descargan al clic
- ✅ Si Ema está escribiendo, Gerson ve el indicador
- ✅ Los mensajes persisten al recargar la página
- ✅ RLS impide ver mensajes ajenos (probado)

### Entregables
```
src/pages/chat/ChatPage.tsx
src/features/chat/hooks/useMessages.ts
src/features/chat/hooks/useRealtimeChat.ts
src/features/chat/hooks/useTypingIndicator.ts
src/features/chat/services/messageService.ts
src/features/chat/services/uploadService.ts
src/features/chat/components/MessageBubble.tsx
src/features/chat/components/MessageInput.tsx
src/features/chat/components/EmojiPicker.tsx
src/features/chat/components/StickerPicker.tsx
src/features/chat/components/FileAttachment.tsx
supabase/migrations/<timestamp>_messages_table.sql
```

---

## 📅 FASE 5 — Reuniones y videollamadas
**Estado**: 🔴 · **Duración estimada**: 1 semana · **Dependencias**: Fases 3, 4
**Agentes**: `meetings-coordinator`, `video-call-integrator`

### Objetivo
Panel de reuniones para acordar encuentros con fecha/hora/lugar. Penalidades automáticas por inasistencia. Integración con Daily.co para videollamadas opcionales.

### Tareas
- [ ] Crear tabla `meetings` con RLS
- [ ] Crear cuenta en Daily.co y obtener API key
- [ ] Wrapper `lib/daily.ts` para crear/unirse a rooms
- [ ] Página `/meetings` con:
  - [ ] Calendario o lista de reuniones próximas
  - [ ] Botón "Proponer reunión"
  - [ ] Estados: pendiente / confirmada / completada / faltó
- [ ] Modal/form para crear reunión:
  - [ ] Fecha y hora
  - [ ] Lugar (texto) o videollamada (genera room Daily.co)
  - [ ] Notas opcionales
- [ ] Flujo de confirmación: el otro usuario debe aceptar
- [ ] Notificación al confirmar/rechazar
- [ ] Recordatorio 1 hora antes de la reunión
- [ ] Post-reunión: cada usuario marca si asistió
- [ ] Si alguien marca "el otro no asistió" y el otro no lo confirma → penalidad
- [ ] Botón "Unirse a videollamada" cuando aplique
- [ ] UI de videollamada con controles (mute, cámara, hangup)

### Definition of Done
- ✅ Puedo proponer una reunión con fecha futura
- ✅ El otro usuario recibe la propuesta y puede aceptar/rechazar
- ✅ Si es por video, ambos pueden entrar a la misma room
- ✅ Audio y video funcionan en la videollamada
- ✅ Si alguien falta, recibe -300 pts y el otro +100 pts
- ✅ Las reuniones pasadas aparecen en historial

### Entregables
```
src/pages/meetings/MeetingsPage.tsx
src/features/meetings/hooks/useMeetings.ts
src/features/meetings/services/meetingService.ts
src/features/meetings/components/MeetingCard.tsx
src/features/meetings/components/CreateMeetingModal.tsx
src/features/meetings/components/VideoCallRoom.tsx
src/lib/daily.ts
supabase/migrations/<timestamp>_meetings_table.sql
supabase/functions/meeting-reminder/index.ts
```

---

## 🎨 FASE 6 — Contenido completo, pulido y deploy
**Estado**: 🔴 · **Duración estimada**: 1–2 semanas · **Dependencias**: Fases 1–5
**Agentes**: `lesson-designer`, `qa-tester`, `code-reviewer`

### Objetivo
App lista para usar en producción: 36 subniveles con contenido real, micro-interacciones, PWA instalable, deploy en Vercel.

### Tareas
- [ ] Completar contenido de los 36 subniveles para inglés y español
- [ ] Añadir audios de pronunciación (TTS o grabados)
- [ ] Implementar 5 tipos de actividad adicionales:
  - [ ] Pronunciación con grabación
  - [ ] Ordenar palabras para formar frase
  - [ ] Traducción ida-vuelta
  - [ ] Mini-diálogo guiado
  - [ ] Crucigrama o juego de palabras
- [ ] Micro-animaciones (Framer Motion o CSS): transiciones de página, hover states, feedback al completar
- [ ] Dark mode
- [ ] PWA: manifest.json, service worker, icon set
- [ ] Notificaciones push (Web Push API)
- [ ] Configurar Sentry o similar para tracking de errores
- [ ] Tests E2E críticos (Playwright o Cypress): login, completar lección, enviar mensaje
- [ ] Deploy en Vercel con CI/CD desde GitHub
- [ ] Dominio personalizado (opcional)
- [ ] Documento de usuario / onboarding inicial

### Definition of Done
- ✅ Los 36 subniveles están completos y jugables
- ✅ La app se siente fluida (animaciones, transiciones)
- ✅ Funciona offline parcialmente (PWA)
- ✅ Las notificaciones push llegan al móvil
- ✅ Tests E2E pasan en CI
- ✅ Deploy en producción con URL pública
- ✅ Lighthouse score >90 en Performance, Accessibility, Best Practices

---

## 🎯 Hitos / Milestones

| Hito | Fase | Criterio |
|---|---|---|
| **M1: Hello World autenticado** | 1 | Login real funciona |
| **M2: Aprender lección 1** | 2 | Completo el subnivel 1 y se desbloquea el 2 |
| **M3: Sistema de puntos vivo** | 3 | Mi puntaje cambia según mi actividad |
| **M4: Primer mensaje cruzado** | 4 | Gerson y Ema chatean en tiempo real |
| **M5: Primera reunión completada** | 5 | Acordamos y asistimos a una reunión |
| **M6: App pública** | 6 | URL en producción usable por ambos |

---

## 🚨 Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Daily.co cobra al pasar free tier | Empezar con WebRTC nativo si lo gratis no alcanza |
| Supabase Realtime con muchos eventos puede sobrecargar | Throttle de typing indicators a 1/seg |
| Crear contenido de 36 subniveles es mucho trabajo | Generar con IA y revisar; empezar con 12 e ir agregando |
| Penalidades automáticas pueden frustrar al usuario | Hacer config "soft mode" donde solo avisan sin restar |
| RLS mal configurado expone datos | Tests específicos de RLS antes de cada release |

---

## 📌 Decisiones técnicas pendientes

- [ ] ¿WebRTC nativo o Daily.co para video? → Decidir en Fase 5
- [ ] ¿TTS del browser (gratis) o ElevenLabs (mejor calidad pero $$) para audios?
- [ ] ¿Notificaciones push web o esperar a wrapper mobile (Capacitor)?
- [ ] ¿Multi-tenant (más parejas en el futuro) o solo Gerson + Ema?

Documentar la decisión y su justificación en `docs/architecture.md` al tomarla.
