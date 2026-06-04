import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  fetchMeetings,
  fetchPendingMeetingsCount,
  createMeeting,
  createInstantMeeting,
  confirmMeeting,
  rejectMeeting,
  cancelMeeting,
  markAttendance,
} from '../services/meetingService';
import type { CreateMeetingInput, CreateInstantMeetingInput, AttendanceInput } from '../types';

export function usePendingMeetingsCount() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['pending_meetings_count', userId],
    queryFn: () => fetchPendingMeetingsCount(userId ?? ''),
    enabled: !!userId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useRealtimePendingBadge() {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const invalidateRef = useRef<() => void>(() => {});

  useEffect(() => {
    invalidateRef.current = () => {
      void qc.invalidateQueries({ queryKey: ['pending_meetings_count', userId] });
    };
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`pending_meetings_badge:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings', filter: `partner_id=eq.${userId}` },
        () => { invalidateRef.current(); },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);
}

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
      createMeeting(input, user?.id ?? '', user?.partner_id ?? ''),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['meetings'] }); },
  });
}

export function useCreateInstantMeeting() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: CreateInstantMeetingInput) =>
      createInstantMeeting(input, user?.id ?? '', user?.partner_id ?? ''),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['meetings'] }); },
  });
}

export function useConfirmMeeting() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (meetingId: string) => {
      const meetings = qc.getQueryData<import('../types').Meeting[]>(['meetings', userId]);
      const meeting = meetings?.find((m) => m.id === meetingId);
      return confirmMeeting(meetingId, meeting?.created_by);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['meetings'] }); },
  });
}

export function useRejectMeeting() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (meetingId: string) => {
      const meetings = qc.getQueryData<import('../types').Meeting[]>(['meetings', userId]);
      const meeting = meetings?.find((m) => m.id === meetingId);
      return rejectMeeting(meetingId, meeting?.created_by);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['meetings'] }); },
  });
}

export function useCancelMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => cancelMeeting(meetingId),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['meetings'] }); },
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceInput) => markAttendance(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['meetings'] });
      void qc.invalidateQueries({ queryKey: ['meeting-timer'] });
    },
  });
}
