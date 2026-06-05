import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { fetchCurrentProfile } from '../services/authService';
import i18n from '@/i18n';

/**
 * Inicializa la sesión de autenticación al arrancar la app.
 *
 * IMPORTANTE: debe montarse UNA sola vez en App.tsx, fuera del árbol
 * de rutas. No renderiza nada visible — solo gestiona el estado global.
 *
 * Por qué aquí y no en useAuth():
 *   useAuth() puede ser invocado por múltiples componentes (AuthGuard,
 *   AppLayout, etc.). Si el useEffect de inicialización viviera ahí,
 *   cada mount llamaría setLoading(true), desmontando componentes que
 *   acaban de aparecer → loop infinito de spinner.
 */
export function AuthProvider() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // onAuthStateChange dispara INITIAL_SESSION al registrarse, cubriendo
    // tanto la carga inicial como los cambios posteriores de sesión.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Hay sesión → cargar el perfil de public.users
      void fetchCurrentProfile()
        .then((profile) => {
          setUser(profile ?? null);
          if (profile?.preferred_language) {
            void i18n.changeLanguage(profile.preferred_language);
          }
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return null;
}
