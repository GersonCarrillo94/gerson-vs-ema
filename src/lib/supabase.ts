import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase.\n' +
      'Crea un archivo .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
  );
}

/**
 * Cliente de Supabase tipado con el schema de la DB.
 * Importar desde aquí en toda la app — nunca crear otro cliente.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
