import { useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { fetchCurrentProfile, loginUser, logoutUser, registerUser } from '../services/authService';
import type { LoginPayload, RegisterPayload } from '../types';

/**
 * Hook principal de autenticación.
 * Expone el usuario actual, estado de carga y acciones de auth.
 *
 * Uso:
 *   const { user, isLoading, login, logout, register } = useAuth();
 */
export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  // Escuchar cambios de sesión de Supabase (login, logout, refresh)
  useEffect(() => {
    setLoading(true);

    // Intentar cargar sesión existente al montar
    void fetchCurrentProfile().then((profile) => {
      setUser(profile ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Recargar perfil cuando la sesión cambia
      void fetchCurrentProfile().then((profile) => {
        setUser(profile ?? null);
        setLoading(false);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

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
