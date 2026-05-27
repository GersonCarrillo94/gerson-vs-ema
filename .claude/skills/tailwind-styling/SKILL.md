---
name: tailwind-styling
description: Use this skill when styling components with Tailwind CSS. Provides class ordering conventions, responsive patterns, design tokens, and when to extract reusable classes.
---

# Skill: Tailwind Styling

## Reglas

1. **100% Tailwind.** Sin `style={...}` inline. Sin archivos CSS por componente. Solo CSS global en `src/index.css` (directivas de Tailwind + reset).
2. **Mobile-first.** Empieza sin prefijo de breakpoint, añade `md:` / `lg:` para tamaños mayores.
3. **Repetición → extracción.** Si una combinación de clases aparece >3 veces, extráela a un componente o usa `@apply`.
4. **Prettier-plugin-tailwindcss** instalado para ordenar clases automáticamente.

## Orden recomendado de clases

El plugin de prettier lo hace solo, pero como referencia:

```
1. Layout         (block, flex, grid, hidden)
2. Position       (relative, absolute, top-0, right-4)
3. Display        (inline, block)
4. Flex/Grid      (flex-col, items-center, justify-between, gap-4)
5. Width/Height   (w-full, h-12, min-h-screen)
6. Spacing        (p-4, px-6, m-2, mx-auto)
7. Typography     (text-lg, font-semibold, leading-tight)
8. Background     (bg-white, bg-gradient-to-r)
9. Border         (border, border-gray-200, rounded-lg)
10. Effects       (shadow-md, opacity-50)
11. Transitions   (transition, duration-200, ease-in-out)
12. States        (hover:, focus:, active:, disabled:)
13. Responsive    (sm:, md:, lg:, xl:)
14. Dark mode     (dark:)
```

## Design tokens (en `tailwind.config.js`)

```js
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          gerson: { 500: '#3B82F6', 600: '#2563EB' },
          ema: { 500: '#F59E0B', 600: '#D97706' },
        },
        level: {
          basic: '#3B82F6',
          intermediate: '#10B981',
          advanced: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'shake': 'shake 400ms ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
};
```

## Breakpoints

```
Default:  0px+    (mobile)
sm:       640px+
md:       768px+   ← tablet / breakpoint mínimo "desktop"
lg:       1024px+
xl:       1280px+
2xl:      1536px+
```

Usa principalmente `md:` para el primer salto a desktop. Evita `sm:` salvo casos justificados.

## Patrones útiles

### Centrar contenido
```tsx
<div className="flex min-h-screen items-center justify-center">
  ...
</div>
```

### Container con padding responsive
```tsx
<div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
  ...
</div>
```

### Card estándar
```tsx
<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
  ...
</div>
```

### Botón primario
```tsx
<button className="rounded-lg bg-brand-gerson-500 px-4 py-2 font-medium text-white hover:bg-brand-gerson-600 focus:outline-none focus:ring-2 focus:ring-brand-gerson-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
  Click
</button>
```

### Input estándar
```tsx
<input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand-gerson-500 focus:outline-none focus:ring-1 focus:ring-brand-gerson-500" />
```

### Grid responsive (1 col mobile, 2 cols tablet, 3 cols desktop)
```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  ...
</div>
```

### Modal/overlay
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
  <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
    ...
  </div>
</div>
```

## Extracción: cuándo hacerlo

### Opción 1: extraer a componente (preferido)
```tsx
// Antes (repetido 5 veces)
<button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">...</button>

// Después
<Button variant="primary">...</Button>
```

### Opción 2: `@apply` en `index.css` (solo para clases muy primitivas)
```css
@layer components {
  .btn-primary {
    @apply rounded-lg bg-brand-gerson-500 px-4 py-2 font-medium text-white;
    @apply hover:bg-brand-gerson-600 focus:ring-2 focus:ring-brand-gerson-500;
    @apply disabled:opacity-50 transition-colors;
  }
}
```

Úsalo SOLO si el patrón es muy estable y no necesita variantes.

### Opción 3: helper de className (cn, clsx, tailwind-merge)
```tsx
import { cn } from '@/utils/cn';

<button
  className={cn(
    'rounded-lg px-4 py-2 font-medium transition-colors',
    variant === 'primary' && 'bg-brand-gerson-500 text-white hover:bg-brand-gerson-600',
    variant === 'secondary' && 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  )}
>
```

`cn` debe ser un helper que combine `clsx` + `tailwind-merge`:
```ts
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Dark mode (cuando se implemente)

```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
```

Configurar en `tailwind.config.js`:
```js
darkMode: 'class', // toggle via class="dark" en <html>
```

## Anti-patrones

```tsx
// ❌ MAL: estilo inline
<div style={{ marginTop: 16, backgroundColor: 'blue' }}>

// ✅ BIEN
<div className="mt-4 bg-blue-500">

// ❌ MAL: clases arbitrarias innecesarias
<div className="mt-[17px] w-[423px]">

// ✅ BIEN: usar la escala
<div className="mt-4 w-96">

// ❌ MAL: mismo botón repetido por toda la app
<button className="rounded-lg bg-blue-500 px-4 py-2 text-white..." />

// ✅ BIEN
<Button variant="primary" />

// ❌ MAL: clases desktop-first
<div className="text-xl md:text-base">

// ✅ BIEN: mobile-first
<div className="text-base md:text-xl">

// ❌ MAL: !important
<div className="!mt-4">  // solo como último recurso

// ❌ MAL: CSS file por componente
// styles.module.css
.myButton { background: blue; }
```

## Accesibilidad y Tailwind

- **Focus visible**: usa `focus:ring-2 focus:ring-offset-2` en elementos interactivos
- **Reducir animaciones para usuarios sensibles**:
  ```tsx
  <div className="motion-safe:animate-bounce">
  ```
- **Contraste**: usa la escala de colores (gray-700+ sobre fondo claro, gray-100+ sobre fondo oscuro)

## Performance

- Tailwind hace tree-shaking de las clases que NO uses en el build → CSS final es pequeño
- Las clases dinámicas (`bg-${color}-500`) NO funcionan con tree-shaking — usa el mapa completo:
  ```tsx
  // ❌ MAL: Tailwind no detecta esto
  const color = 'red';
  <div className={`bg-${color}-500`} />

  // ✅ BIEN
  const colors = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };
  <div className={colors[color]} />
  ```
