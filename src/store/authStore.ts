import { create } from 'zustand';
import type { UserProfile } from '@/types/user';

interface AuthStoreState {
  /** `undefined` = estado inicial/cargando, `null` = no autenticado, `UserProfile` = autenticado */
  user: UserProfile | null | undefined;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
}

/**
 * Store global de autenticación.
 * No usar directamente en componentes — usar `useAuth()` en su lugar.
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
  user: undefined,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));
