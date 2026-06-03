import type { LearningLanguage, UserProfile } from '@/types/user';

/** Estado del store de autenticación */
export interface AuthState {
  /** Usuario autenticado. `null` = no logueado. `undefined` = cargando */
  user: UserProfile | null | undefined;
  isLoading: boolean;
}

/** Payload para registrar un nuevo usuario */
export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  languageLearning: LearningLanguage;
}

/** Payload para iniciar sesión */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Error de autenticación tipado */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export class AuthAppError extends Error implements AuthError {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthAppError';
    this.code = code;
  }
}
