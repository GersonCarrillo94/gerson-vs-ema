import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchMyScoreData, fetchPartnerScoreData } from '../services/scoreService';

export function useMyScore() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my_score', user?.id],
    queryFn: () => fetchMyScoreData(user?.id ?? ''),
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

export function usePartnerScore() {
  const { user } = useAuth();
  const partnerId = user?.partner_id;

  return useQuery({
    queryKey: ['partner_score', partnerId],
    queryFn: () => fetchPartnerScoreData(partnerId ?? ''),
    enabled: !!partnerId,
    staleTime: 60_000,
  });
}

export function useInvalidateScore() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ['my_score', user?.id] });
  };
}
