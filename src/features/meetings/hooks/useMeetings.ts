import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import {
  fetchMeetings,
  createMeeting,
  confirmMeeting,
  rejectMeeting,
  cancelMeeting,
  markAttendance,
} from '../services/meetingService';
import type { CreateMeetingInput, AttendanceInput } from '../types';

export function useMeetings() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? '';
  const partnerId = user?.partner_id ?? '';

  return useQuery({
    queryKey: ['meetings', userId],
    queryFn: () => fetchMeetings(userId, partnerId),
    enabled: !!userId && !!partnerId,
    staleTime: 1000 * 60,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: CreateMeetingInput) =>
      createMeeting(input, user!.id, user!.partner_id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

export function useConfirmMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => confirmMeeting(meetingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

export function useRejectMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => rejectMeeting(meetingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

export function useCancelMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => cancelMeeting(meetingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceInput) => markAttendance(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['meeting-timer'] });
    },
  });
}
