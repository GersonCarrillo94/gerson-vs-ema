import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { AuthAppError } from '../types';
import type { AuthErrorCode, LoginPayload, RegisterPayload } from '../types';
import type { UserProfile } from '@/types/user';

/** Convierte errores de Supabase a nuestro tipo AuthAppError */
function mapSupabaseError(message: string): AuthAppError {
  const msg = message.toLowerCase();

  let code: AuthErrorCode = 'UNKNOWN';

  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    code = 'INVALID_CREDENTIALS';
  } else if (msg.includes('user already registered') || msg.includes('already been registered')) {
    code = 'EMAIL_ALREADY_EXISTS';
  } else if (msg.includes('password should be at least')) {
    code = 'WEAK_PASSWORD';
  } else if (msg.includes('network') || msg.includes('fetch')) {
    code = 'NETWORK_ERROR';
  }

  return new AuthAppError(code, message);
}

/**
 * Registra un nuevo usuario.
 *
 * El perfil en public.users es creado automáticamente por el trigger
 * on_auth_user_created (SECURITY DEFINER). Los datos de perfil viajan
 * como metadata en signUp y el trigger los lee desde raw_user_meta_data.
 *
 * No es necesario hacer INSERT manual — solo leer el perfil creado.
 */
export async function registerUser(payload: RegisterPayload): Promise<UserProfile> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      // El trigger on_auth_user_created lee estos valores de raw_user_meta_data
      data: {
        display_name: payload.displayName,
        language_learning: payload.languageLearning,
      },
    },
  });

  if (authError) {
    logger.error('authService.registerUser - signUp', authError.message);
    throw mapSupabaseError(authError.message);
  }

  if (!authData.user) {
    throw new AuthAppError('UNKNOWN', 'No se pudo obtener el ID del usuario creado.');
  }

  // Si session es null → "Confirm email" está activo en Supabase
  if (!authData.session) {
    throw new AuthAppError(
      'UNKNOWN',
      'Debes confirmar tu email antes de continuar. ' +
      'Para desarrollo desactiva "Confirm email" en Supabase → Authentication → Providers → Email.',
    );
  }

  // Forzar que el cliente aplique la sesión antes de hacer queries a la DB.
  // Sin esto, PostgREST puede enviar la petición sin el JWT y RLS bloquea la lectura.
  await supabase.auth.setSession({
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
  });

  // El trigger on_auth_user_created crea el perfil en la misma transacción
  // del signUp. Le damos un pequeño margen para que PostgREST lo refleje.
  const profile = await fetchProfileWithRetry(authData.user.id);

  if (!profile) {
    logger.error('authService.registerUser', 'Profile not readable after 3 attempts');
    await supabase.auth.signOut();
    throw new AuthAppError('UNKNOWN', 'No se pudo cargar el perfil recién creado. Por favor intenta de nuevo.');
  }

  return profile;
}

/** Inicia sesión con email y contraseña */
export async function loginUser(payload: LoginPayload): Promise<UserProfile> {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (authError) {
    logger.error('authService.loginUser', authError.message);
    throw mapSupabaseError(authError.message);
  }

  const profile = await fetchCurrentProfile();

  if (!profile) {
    await supabase.auth.signOut();
    throw new AuthAppError('UNKNOWN', 'Tu cuenta existe pero no tiene perfil. Por favor regístrate de nuevo.');
  }

  return profile;
}

/** Actualiza el perfil del usuario actual (display_name, phone y/o preferred_language). */
export async function updateProfile(fields: {
  display_name?: string;
  phone?: string | null;
  preferred_language?: 'es' | 'en';
}): Promise<UserProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw mapSupabaseError('No autenticado');

  const { data, error } = await supabase
    .from('users')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('authService.updateProfile', error.message);
    throw mapSupabaseError(error.message);
  }

  return data;
}

/** Cierra sesión */
export async function logoutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.error('authService.logoutUser', error.message);
    throw mapSupabaseError(error.message);
  }
}

/** Obtiene el perfil del usuario actualmente autenticado */
export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // maybeSingle() devuelve null (sin error) si no hay filas,
  // a diferencia de single() que lanza PGRST116 cuando no hay resultado.
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    logger.error('authService.fetchCurrentProfile', error.message);
    return null;
  }

  return data;
}

/**
 * Reintenta obtener el perfil hasta 3 veces con backoff.
 * Necesario porque el trigger de Supabase y PostgREST pueden tener
 * un pequeño desfase de visibilidad justo después del signUp.
 */
async function fetchProfileWithRetry(userId: string, maxAttempts = 3): Promise<UserProfile | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logger.error(`fetchProfileWithRetry attempt ${attempt.toString()}`, error.message);
    } else if (data) {
      return data;
    }

    if (attempt < maxAttempts) {
      // Backoff: 300ms → 700ms
      await new Promise<void>((resolve) => setTimeout(resolve, attempt * 300));
    }
  }
  return null;
}
