import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { loginUser, logoutUser, registerUser } from '../services/authService';
import type { LoginPayload, RegisterPayload } from '../types';

/**
 * Hook principal de autenticación.
 * Expone el usuario actual, estado de carga y acciones de auth.
 *
 * La inicialización de sesión (onAuthStateChange) vive en AuthProvider,
 * que se monta UNA sola vez en App.tsx. Este hook solo lee del store
 * y expone las acciones — sin efectos secundarios al montar.
 *
 * Uso:
 *   const { user, isLoading, login, logout, register } = useAuth();
 */
export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      try {
        const profile = await loginUser(payload);
        setUser(profile);
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setLoading(true);
      try {
        const profile = await registerUser(payload);
        setUser(profile);
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading],
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  return {
    /** Perfil del usuario autenticado. `null` = no logueado. `undefined` = cargando */
    user,
    /** `true` mientras se verifica la sesión */
    isLoading,
    /** `true` si hay un usuario logueado */
    isAuthenticated: user != null,
    login,
    register,
    logout,
  };
}
