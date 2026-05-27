import type { Database } from './database';

/** Perfil de usuario tal como viene de la tabla `users` de Supabase */
export type UserProfile = Database['public']['Tables']['users']['Row'];

/** Idioma que está aprendiendo el usuario */
export type LearningLanguage = 'english' | 'spanish';

/** Usuario autenticado (sesión activa) */
export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}
