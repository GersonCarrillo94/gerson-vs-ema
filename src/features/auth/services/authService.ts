import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { AuthError, AuthErrorCode, LoginPayload, RegisterPayload } from '../types';
import type { UserProfile } from '@/types/user';

/** Convierte errores de Supabase a nuestro tipo AuthError */
function mapSupabaseError(message: string): AuthError {
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

  return { code, message };
}

/**
 * Registra un nuevo usuario.
 *
 * El perfil en public.users se crea automáticamente mediante el trigger
 * `on_auth_user_created` en Supabase (SECURITY DEFINER, sin necesidad de
 * que el cliente tenga política RLS de INSERT).
 *
 * Los datos de perfil viajan como metadata en signUp y el trigger los lee
 * desde `raw_user_meta_data`.
 */
export async function registerUser(payload: RegisterPayload): Promise<UserProfile> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        display_name: payload.displayName,
        language_learning: payload.languageLearning,
      },
    },
  });

  if (authError) {
    logger.error('authService.registerUser', authError.message);
    throw mapSupabaseError(authError.message);
  }

  if (!authData.user) {
    throw {
      code: 'UNKNOWN',
      message: 'No se pudo obtener el ID del usuario creado.',
    } satisfies AuthError;
  }

  // El trigger on_auth_user_created ya habrá creado el perfil de forma
  // sincrónica. Lo cargamos para retornarlo al caller.
  const profile = await fetchCurrentProfile();

  if (!profile) {
    // Esto solo ocurriría si el trigger no está instalado o falló.
    await supabase.auth.signOut();
    throw {
      code: 'UNKNOWN',
      message:
        'No se pudo crear tu perfil. Verifica que el trigger on_auth_user_created está activo en Supabase.',
    } satisfies AuthError;
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
    // La cuenta existe en Auth pero no tiene perfil — estado inconsistente.
    // Cerramos sesión para dejar al usuario en estado limpio.
    await supabase.auth.signOut();
    throw {
      code: 'UNKNOWN',
      message:
        'Tu cuenta existe pero no tiene perfil. Por favor regístrate de nuevo o contacta soporte.',
    } satisfies AuthError;
  }

  return profile;
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

  const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

  if (error) {
    logger.error('authService.fetchCurrentProfile', error.message);
    return null;
  }

  return data;
}
