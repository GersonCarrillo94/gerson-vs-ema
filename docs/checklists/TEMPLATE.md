# Sesión XXX — [Título corto descriptivo]

> **Fecha**: YYYY-MM-DD
> **Duración**: HHh MMm
> **Fase del roadmap**: [ej: Fase 2 — Sistema de lecciones]
> **Branch**: [ej: feat/lesson-system]

---

## 🎯 Objetivo de la sesión

[1-2 oraciones describiendo qué se quería lograr al empezar]

---

## ✅ Hecho hoy

- [x] Tarea 1 completada
- [x] Tarea 2 completada
- [x] ...

### Archivos creados
- `src/path/to/NewFile.tsx`
- `docs/new-doc.md`

### Archivos modificados
- `src/path/to/ExistingFile.tsx` — qué cambió
- `package.json` — agregadas dependencias X, Y

### Migraciones DB ejecutadas
- `supabase/migrations/YYYYMMDDHHmmss_descripcion.sql`

---

## ⏳ Pendiente para próxima sesión

> Ordenado por prioridad. La siguiente sesión debe atacar estos en orden.

### 🔴 Alta prioridad (bloquea otras cosas)
- [ ] Tarea crítica 1
- [ ] Tarea crítica 2

### 🟡 Media prioridad
- [ ] Mejora 1
- [ ] Mejora 2

### 🟢 Baja prioridad (nice to have)
- [ ] Refactor sugerido
- [ ] Mejora visual

---

## 🚨 Bloqueos / problemas sin resolver

> Si quedó algo roto, mal entendido o esperando decisión del usuario.

- **Problema**: [descripción]
  - **Contexto**: cómo se descubrió
  - **Hipótesis**: posible causa
  - **Acción sugerida**: qué probar primero la próxima vez

---

## 📌 Decisiones tomadas

> Cualquier decisión técnica que afecte el resto del proyecto. NO solo cambios en código.

1. **Decisión**: [ej: usar Daily.co en lugar de WebRTC nativo]
   - **Razón**: [ej: setup en 30 min vs días con WebRTC]
   - **Implicación**: [ej: costo si pasamos free tier]
   - **Reversibilidad**: [fácil / media / difícil]

---

## 💡 Notas y aprendizajes

> Cosas no obvias que descubriste y vale la pena recordar.

- Aprendizaje 1
- Truco 2 que ahorra tiempo
- Gotcha que casi causa un bug

---

## 📂 Estado de Git

```bash
# Branch actual
git branch --show-current
# > feat/lesson-system

# Commits de esta sesión
git log --oneline main..HEAD
# > abc1234 feat(lessons): add flashcards component
# > def5678 feat(lessons): wire up sublevel progression
```

---

## 🔄 Cómo retomar (instrucciones para próxima sesión)

> Esta es LA sección más importante. Debe ser tan clara que cualquiera
> (incluyendo otro Claude) pueda continuar sin contexto adicional.

1. Hacer `git pull` y revisar que estás en branch `[branch-name]`
2. Correr `npm install` por si hay deps nuevas
3. Correr `npm run dev` y verificar que arranca sin errores
4. Abrir `[archivo específico]` y continuar desde la línea `[N]` / función `[X]`
5. La siguiente tarea concreta es: **"[descripción específica]"**

### Comandos exactos para empezar
```bash
git checkout feat/lesson-system
git pull
npm install
npm run dev
# Abrir http://localhost:5173/lessons/1
```

---

## 📊 Métricas (opcional)

- Líneas de código añadidas: ~XXX
- Tests añadidos: X
- Cobertura actual: XX%
- Lighthouse score: XX/XX/XX/XX
