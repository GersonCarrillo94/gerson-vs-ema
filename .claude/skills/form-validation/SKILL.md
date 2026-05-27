---
name: form-validation
description: Use this skill when implementing forms — login, signup, create meeting, send message, profile edit, etc. Provides the pattern using Zod for schema validation, react-hook-form for form state, and how to display errors accessibly.
---

# Skill: Form Validation

## Stack para formularios

- **Zod** para schemas (validación tipada)
- **react-hook-form** para manejo de estado y submission
- **@hookform/resolvers/zod** para conectarlos

Instalar:
```bash
npm install zod react-hook-form @hookform/resolvers
```

## Patrón estándar

```tsx
// src/features/auth/components/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// 1. Schema con Zod (puede vivir en services/)
const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres'),
});

type LoginFormData = z.infer<typeof LoginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const submitHandler = async (data: LoginFormData) => {
    try {
      await onSubmit(data);
    } catch (err) {
      // Errores del backend → mostrar en el form
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError('root', { message });
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} noValidate className="space-y-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        {...register('email')}
        error={errors.email?.message}
        aria-invalid={!!errors.email}
      />

      <Input
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        {...register('password')}
        error={errors.password?.message}
        aria-invalid={!!errors.password}
      />

      {errors.root && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600" role="alert">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Entrando...' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
```

## Componente Input (en `src/components/ui/Input.tsx`)

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `input-${props.name}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            'w-full rounded-lg border px-3 py-2 transition-colors',
            'focus:outline-none focus:ring-2',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-brand-gerson-500 focus:ring-brand-gerson-200',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
```

## Schemas comunes del proyecto

### Sign up
```ts
const SignUpSchema = z.object({
  email: z.string().min(1, 'Email requerido').email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  displayName: z
    .string()
    .min(1, 'Nombre requerido')
    .max(50, 'Nombre demasiado largo'),
  languageLearning: z.enum(['english', 'spanish'], {
    errorMap: () => ({ message: 'Selecciona un idioma' }),
  }),
});
```

### Crear reunión
```ts
const CreateMeetingSchema = z.object({
  scheduledAt: z
    .date()
    .refine((d) => d > new Date(), 'La fecha debe ser futura')
    .refine(
      (d) => d > new Date(Date.now() + 60 * 60 * 1000),
      'Mínimo 1 hora de anticipación'
    ),
  location: z.string().max(200).optional(),
  isVideoCall: z.boolean(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.isVideoCall || (data.location && data.location.length > 0),
  { message: 'Indica una ubicación o marca videollamada', path: ['location'] }
);
```

### Mensaje de chat
```ts
const SendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(2000, 'Máximo 2000 caracteres')
    .transform((s) => s.trim()),
});
```

## Patrones útiles de Zod

### Coerción
```ts
// El input es string, el schema lo convierte a número
z.coerce.number().int().positive()

// Input string a Date
z.coerce.date()
```

### Refinements (validación custom)
```ts
z.string().refine(
  (val) => !val.includes('admin'),
  'No puede contener "admin"'
)

// Con acceso a otros campos (en superRefine)
z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    });
  }
});
```

### Transformaciones
```ts
const EmailSchema = z.string().email().transform((s) => s.toLowerCase().trim());
```

### Tipos derivados
```ts
const Schema = z.object({ name: z.string() });
type FormData = z.infer<typeof Schema>;  // { name: string }
```

## Validación en tiempo real

react-hook-form valida `onSubmit` por defecto. Para feedback inmediato:

```ts
useForm({
  resolver: zodResolver(Schema),
  mode: 'onBlur',  // valida al perder focus (recomendado)
  // mode: 'onChange',  // valida en cada keystroke (puede sentirse molesto)
});
```

## Accesibilidad

- **Labels asociados**: `htmlFor` apuntando a `id` del input
- **Errores con `role="alert"`**: lectores de pantalla anuncian inmediatamente
- **`aria-invalid={true}`** en inputs con error
- **`aria-describedby`** apuntando al ID del mensaje de error
- **`autoComplete`** apropiado: `email`, `current-password`, `new-password`, `name`
- **`noValidate`** en el form para deshabilitar validación nativa del browser (que se ve fea)
- **Focus al primer error** después de submit fallido (react-hook-form lo hace si `shouldFocusError: true`)

## Submit con backend errors

```ts
const submitHandler = async (data: FormData) => {
  try {
    await signUp(data);
  } catch (err) {
    // Errores específicos a campos
    if (err.code === 'EMAIL_ALREADY_EXISTS') {
      setError('email', { message: 'Este email ya está registrado' });
    } else {
      // Error general
      setError('root', { message: getReadableError(err) });
    }
  }
};
```

## Anti-patrones

- ❌ Validar SOLO en frontend (sin RLS / backend validation) → seguridad agujereada
- ❌ Mostrar mensajes de error genéricos ("Error") → frustra al usuario
- ❌ Validación en tiempo real demasiado agresiva (cada keystroke) → molesta
- ❌ Form sin estado de loading durante submit → usuario hace doble click
- ❌ Limpiar el form después de submit fallido → usuario pierde lo escrito
- ❌ Errores mostrados solo en consola, no en UI
- ❌ Type assertion en lugar de Zod parse: `const data = formData as MyType`
- ❌ Schema diferente entre frontend y backend → drift de validación
