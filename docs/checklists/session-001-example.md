# Sesión 001 — Setup inicial del proyecto

> **Fecha**: 2026-05-26
> **Duración**: 2h 30m
> **Fase del roadmap**: Fase 1 — Fundación y autenticación
> **Branch**: `main` (primera sesión, sin feature branch aún)

---

## 🎯 Objetivo de la sesión

Inicializar el proyecto Vite + React + TypeScript, configurar Tailwind, conectar con Supabase y dejar listo el cliente tipado.

---

## ✅ Hecho hoy

- [x] `npm create vite@latest gerson-vs-ema -- --template react-ts`
- [x] Instaladas dependencias base: react-router-dom, @supabase/supabase-js, zustand, @tanstack/react-query
- [x] Configurado Tailwind CSS según `docs/conventions.md`
- [x] Configurado alias `@/` en `tsconfig.json` y `vite.config.ts`
- [x] Creada estructura de carpetas (`src/components/ui`, `src/features`, `src/pages`, etc.)
- [x] Creado proyecto en Supabase Cloud (proyecto: `gerson-vs-ema-dev`)
- [x] Configurado `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- [x] Creado `.env.example` con valores vacíos
- [x] Creado `src/lib/supabase.ts` con cliente tipado
- [x] Configurado ESLint + Prettier con reglas de conventions.md
- [x] Inicializado Git y primer commit

### Archivos creados
- `src/lib/supabase.ts`
- `src/types/database.ts` (generado con `supabase gen types`)
- `.env.local` (gitignored)
- `.env.example`
- `tailwind.config.js`
- `postcss.config.js`
- `.eslintrc.cjs`
- `.prettierrc`

### Archivos modificados
- `package.json` — agregadas todas las deps del stack
- `tsconfig.json` — añadidos paths absolutos y modo strict
- `vite.config.ts` — añadido alias `@/`
- `src/main.tsx` — añadido `<QueryClientProvider>`
- `src/index.css` — directivas de Tailwind

### Migraciones DB ejecutadas
- Ninguna en esta sesión

---

## ⏳ Pendiente para próxima sesión

### 🔴 Alta prioridad
- [ ] Crear tabla `users` en Supabase con el schema de `docs/database-schema.md`
- [ ] Configurar RLS policies para `users`
- [ ] Implementar `useAuth` hook con sign up / sign in / sign out
- [ ] Crear `<AuthGuard>` component
- [ ] Crear página `/login` con formulario validado (Zod)

### 🟡 Media prioridad
- [ ] Crear página `/register` con flujo de selección de idioma
- [ ] Crear layout principal con sidebar de navegación
- [ ] Diseñar logo simple en SVG inline

### 🟢 Baja prioridad
- [ ] Dark mode toggle (puede esperar hasta Fase 6)
- [ ] Animación de entrada del login

---

## 🚨 Bloqueos / problemas sin resolver

- **Problema**: El comando `supabase gen types typescript` falló inicialmente porque no estaba logueado en CLI.
  - **Contexto**: descubrí al intentar generar tipos automáticos
  - **Hipótesis**: necesitaba `supabase login` antes
  - **Acción sugerida**: ya resuelto — `supabase login` antes de generar tipos. Documentado en README.

- **Pendiente de confirmar**: ¿usamos Supabase CLI local o solo Cloud? Por ahora solo Cloud. Decisión final en sesión 2.

---

## 📌 Decisiones tomadas

1. **Decisión**: Usar `@supabase/supabase-js` v2.45 (no v3 beta)
   - **Razón**: v3 aún en beta, v2 es estable y bien documentada
   - **Implicación**: ninguna inmediata
   - **Reversibilidad**: fácil (cambiar major version)

2. **Decisión**: Tailwind CSS v3.4, NO v4 (alpha)
   - **Razón**: v4 cambia mucha sintaxis, prefiero estabilidad
   - **Implicación**: cuando v4 sea estable, migrar
   - **Reversibilidad**: media (cambia config y algunas clases)

3. **Decisión**: Generar tipos TypeScript de la DB automáticamente con `supabase gen types`
   - **Razón**: tipado end-to-end sin escribir manual
   - **Implicación**: cada vez que cambia el schema, regenerar
   - **Reversibilidad**: fácil

---

## 💡 Notas y aprendizajes

- Vite no incluye PostCSS por defecto, hay que instalar `postcss autoprefixer` aunque Tailwind los pida
- El alias `@/` requiere config en TRES lugares: `tsconfig.json`, `vite.config.ts` Y `.eslintrc.cjs` (para import/resolver)
- Supabase Cloud free tier: 500MB DB + 1GB storage + 50,000 MAU. Suficiente para los próximos meses.

---

## 📂 Estado de Git

```bash
git branch --show-current
# > main

git log --oneline
# > a1b2c3d chore: initial project setup with vite + react + ts
# > d4e5f6g chore: configure tailwind, eslint, prettier
# > 7h8i9j0 chore: integrate supabase client
# > 1k2l3m4 chore: session 001 handoff
```

---

## 🔄 Cómo retomar (instrucciones para próxima sesión)

1. Hacer `git pull` y verificar que estás en `main`
2. Correr `npm install` (no se han añadido deps nuevas pero por si acaso)
3. Verificar que `.env.local` está presente con las credenciales de Supabase
4. Correr `npm run dev` — debe abrir en `http://localhost:5173` mostrando la pantalla default de Vite con Tailwind funcionando
5. La siguiente tarea concreta es: **"Crear tabla `users` en Supabase y empezar el flujo de autenticación"**

### Comandos exactos para empezar
```bash
git pull
npm install
cp .env.example .env.local  # solo si no existe; luego pegar credenciales
npm run dev

# En otra terminal, para tipos:
npx supabase login  # si aún no se hizo
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

### Primera tarea concreta
Abrir Supabase dashboard → SQL Editor → pegar la migración de `docs/database-schema.md` para la tabla `users`. Luego crear `src/features/auth/hooks/useAuth.ts`.

---

## 📊 Métricas

- Líneas de código añadidas: ~80 (mayoría configs)
- Tests añadidos: 0
- Tiempo invertido: 2h 30m
- Setup completado: 100% del checklist de Fase 1 hasta el punto "Login real"
