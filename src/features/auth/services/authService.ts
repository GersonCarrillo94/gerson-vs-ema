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
 * Flujo:
 *  1. signUp → crea el auth user y devuelve sesión (email confirmation debe estar OFF)
 *  2. RPC create_user_profile → inserta en public.users con SECURITY DEFINER
 *     (bypasea RLS; la función verifica auth.uid() internamente)
 *
 * Si el paso 2 falla hacemos signOut para evitar auth users huérfanos.
 */
export async function registerUser(payload: RegisterPayload): Promise<UserProfile> {
  // Paso 1: crear auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });

  if (authError) {
    logger.error('authService.registerUser - signUp', authError.message);
    throw mapSupabaseError(authError.message);
  }

  if (!authData.user) {
    throw { code: 'UNKNOWN', message: 'No se pudo obtener el ID del usuario creado.' } satisfies AuthError;
  }

  // Si session es null → "Confirm email" está activo en Supabase
  if (!authData.session) {
    throw {
      code: 'UNKNOWN',
      message:
        'Debes confirmar tu email antes de continuar. ' +
        'Para desarrollo desactiva "Confirm email" en Supabase → Authentication → Providers → Email.',
    } satisfies AuthError;
  }

  // Paso 2: crear perfil via RPC (SECURITY DEFINER, sin RLS)
  const { error: rpcError } = await supabase.rpc('create_user_profile', {
    p_display_name: payload.displayName,
    p_language_learning: payload.languageLearning,
  });

  if (rpcError) {
    logger.error('authService.registerUser - create_user_profile RPC', rpcError.message);
    // Rollback: cerrar sesión para evitar auth user huérfano
    await supabase.auth.signOut();
    throw {
      code: 'UNKNOWN',
      message: 'No se pudo crear tu perfil. Por favor intenta de nuevo.',
    } satisfies AuthError;
  }

  // Cargar el perfil recién creado
  const profile = await fetchCurrentProfile();
  if (!profile) {
    await supabase.auth.signOut();
    throw {
      code: 'UNKNOWN',
      message: 'Perfil creado pero no se pudo cargar. Intenta iniciar sesión.',
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
    await supabase.auth.signOut();
    throw {
      code: 'UNKNOWN',
      message: 'Tu cuenta existe pero no tiene perfil. Por favor regístrate de nuevo.',
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
