import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AuthError } from '@/features/auth/types';

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir si ya está logueado
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
  useEffect(() => {
    if (isAuthenticated) void navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (err) {
      const authError = err as AuthError;
      const msg =
        authError.code === 'INVALID_CREDENTIALS'
          ? 'Email o contraseña incorrectos'
          : authError.message;
      setError('root', { message: msg });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-brand-gerson">Gerson</span>
            <span className="mx-2 text-gray-400">vs</span>
            <span className="text-brand-ema">Ema</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">Aprende juntos, compite juntos</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Iniciar sesión</h2>

          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
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
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

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
            >
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-brand-gerson hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
