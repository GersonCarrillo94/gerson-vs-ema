import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AuthError } from '@/features/auth/types';
import type { LearningLanguage } from '@/types/user';

type RegisterFormData = {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  languageLearning: 'english' | 'spanish';
};

export function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerAuth, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<LearningLanguage | null>(null);

  const registerSchema = useMemo(() => z.object({
    displayName: z
      .string()
      .min(2, 'auth.errors.shortName')
      .max(50, 'auth.errors.longName'),
    email: z.string().email('auth.errors.invalidEmail'),
    password: z
      .string()
      .min(8, 'auth.errors.shortPasswordReg')
      .regex(/[A-Z]/, 'auth.errors.noUppercase')
      .regex(/[0-9]/, 'auth.errors.noNumber'),
    confirmPassword: z.string(),
    languageLearning: z.enum(['english', 'spanish'] as const),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'auth.errors.passwordMismatch',
    path: ['confirmPassword'],
  }), []);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
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
          ? t('auth.errors.emailExists')
          : authError.code === 'WEAK_PASSWORD'
            ? t('auth.errors.weakPassword')
            : authError.message;
      setError('root', { message: msg });
    }
  };

  const languageOptions = [
    { value: 'english' as LearningLanguage, label: t('auth.english'), flag: '🇺🇸', description: t('auth.learnEnglish') },
    { value: 'spanish' as LearningLanguage, label: t('auth.spanish'), flag: '🇪🇸', description: t('auth.learnSpanish') },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-brand-gerson">Gerson</span>
            <span className="mx-2 text-gray-400">vs</span>
            <span className="text-brand-ema">Ema</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">{t('auth.createAccountTagline')}</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">{t('auth.registerTitle')}</h2>

          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
            <Input
              label={t('auth.name')}
              type="text"
              autoComplete="name"
              placeholder={t('auth.namePlaceholder')}
              error={errors.displayName?.message ? t(errors.displayName.message) : undefined}
              {...register('displayName')}
            />

            <Input
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              error={errors.email?.message ? t(errors.email.message) : undefined}
              {...register('email')}
            />

            <Input
              label={t('auth.password')}
              type="password"
              autoComplete="new-password"
              placeholder={t('auth.passwordMinPlaceholder')}
              hint={t('auth.passwordHint')}
              error={errors.password?.message ? t(errors.password.message) : undefined}
              {...register('password')}
            />

            <Input
              label={t('auth.confirmPassword')}
              type="password"
              autoComplete="new-password"
              placeholder={t('auth.confirmPasswordPlaceholder')}
              error={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined}
              {...register('confirmPassword')}
            />

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">{t('auth.languageQuestion')}</p>
              <div className="grid grid-cols-2 gap-3">
                {languageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { handleLanguageSelect(option.value); }}
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
              <input type="hidden" {...register('languageLearning')} />
              {errors.languageLearning && (
                <p role="alert" className="mt-1 text-sm text-red-600">
                  {t('auth.errors.selectLanguage')}
                </p>
              )}
            </div>

            {errors.root && (
              <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.root.message}
              </div>
            )}

            <Button
              type="submit"
              className="mt-2 w-full"
              isLoading={isSubmitting || isLoading}
              disabled={!selectedLanguage}
            >
              {t('auth.registerButton')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="font-medium text-brand-gerson hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
