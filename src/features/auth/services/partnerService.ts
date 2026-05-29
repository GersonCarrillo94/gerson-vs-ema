import { supabase } from '@/lib/supabase';

export type SearchMethod = 'name' | 'email' | 'phone';

export interface PartnerSearchResult {
  id: string;
  display_name: string;
  language_learning: string;
  avatar_url: string | null;
}

/** Busca usuarios disponibles para vincular (sin compañero asignado). */
export async function searchPartner(
  query: string,
  method: SearchMethod,
): Promise<PartnerSearchResult[]> {
  const { data, error } = await supabase.rpc('search_potential_partner', {
    p_query: query,
    p_method: method,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as PartnerSearchResult[];
}

/** Vincula mutuamente al usuario actual con p_partner_id. */
export async function linkPartner(partnerId: string): Promise<void> {
  const { error } = await supabase.rpc('link_partner', { p_partner_id: partnerId });
  if (error) {
    const hint = error.hint ?? error.message;
    throw new Error(hint);
  }
}
