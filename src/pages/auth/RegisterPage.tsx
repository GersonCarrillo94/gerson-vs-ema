import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AuthError } from '@/features/auth/types';
import type { LearningLanguage } from '@/types/user';

const registerSchema = z.object({
  displayName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  email: z.string().email('Ingresa un email válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
  languageLearning: z.enum(['english', 'spanish'] as const),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface LanguageOption {
  value: LearningLanguage;
  label: string;
  flag: string;
  description: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    value: 'english',
    label: 'Inglés',
    flag: '🇺🇸',
    description: 'Quiero aprender inglés',
  },
  {
    value: 'spanish',
    label: 'Español',
    flag: '🇪🇸',
    description: 'Quiero aprender español',
  },
];

export function RegisterPage() {
  const { register: registerAuth, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<LearningLanguage | null>(null);

  useEffect(() => {
    if (isAuthenticated) void navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleLanguageSelect = (lang: LearningLanguage) => {
    setSelectedLanguage(lang);
    setValue('languageLearning', lang, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerAuth({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        languageLearning: data.languageLearning,
      });
    } catch (err) {
      const authError = err as AuthError;
      const msg =
        authError.code === 'EMAIL_ALREADY_EXISTS'
          ? 'Este email ya está registrado'
          : authError.code === 'WEAK_PASSWORD'
            ? 'La contraseña no cumple los requisitos mínimos'
            : authError.message;
      setError('root', { message: msg });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-brand-gerson">Gerson</span>
            <span className="mx-2 text-gray-400">vs</span>
            <span className="text-brand-ema">Ema</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">Crea tu cuenta y empieza a aprender</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Crear cuenta</h2>

          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
            <Input
              label="¿Cómo te llamas?"
              type="text"
              autoComplete="name"
              placeholder="Tu nombre"
              error={errors.displayName?.message}
              {...register('displayName')}
            />

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              hint="Debe incluir al menos una mayúscula y un número"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {/* Selección de idioma */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                ¿Qué idioma quieres aprender?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleLanguageSelect(option.value)}
                    className={[
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4',
                      'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gerson',
                      selectedLanguage === option.value
                        ? 'border-brand-gerson bg-brand-gerson/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    ].join(' ')}
                    aria-pressed={selectedLanguage === option.value}
                  >
                    <span className="text-3xl">{option.flag}</span>
                    <span className="text-sm font-semibold text-gray-900">{option.label}</span>
                    <span className="text-center text-xs text-gray-500">{option.description}</span>
                  </button>
                ))}
              </div>
              {/* Campo oculto para react-hook-form */}
              <input type="hidden" {...register('languageLearning')} />
              {errors.languageLearning && (
                <p role="alert" className="mt-1 text-sm text-red-600">
                  Selecciona el idioma que quieres aprender
                </p>
              )}
            </div>

            {errors.root && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errors.root.message}
              </div>
            )}

            <Button
              type="submit"
              className="mt-2 w-full"
              isLoading={isSubmitting || isLoading}
              disabled={!selectedLanguage}
            >
              Crear cuenta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-brand-gerson hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
