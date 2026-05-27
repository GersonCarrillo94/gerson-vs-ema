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

/** Registra un nuevo usuario y crea su perfil en `public.users` */
export async function registerUser(payload: RegisterPayload): Promise<UserProfile> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });

  if (authError) {
    logger.error('authService.registerUser', authError.message);
    throw mapSupabaseError(authError.message);
  }

  const userId = authData.user?.id;
  if (!userId) {
    throw { code: 'UNKNOWN', message: 'No se pudo obtener el ID del usuario creado.' } satisfies AuthError;
  }

  // Crear perfil en public.users (Supabase Auth y public.users son tablas separadas)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: payload.email,
      display_name: payload.displayName,
      language_learning: payload.languageLearning,
    })
    .select()
    .single();

  if (profileError) {
    logger.error('authService.registerUser - creating profile', profileError.message);
    throw mapSupabaseError(profileError.message);
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
    throw { code: 'UNKNOWN', message: 'No se encontró el perfil del usuario.' } satisfies AuthError;
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
