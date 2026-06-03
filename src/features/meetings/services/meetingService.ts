import { supabase } from '@/lib/supabase';
import { createDailyRoom } from '@/lib/daily';
import type { Database } from '@/types/database';
import type { Meeting, MeetingTimer, CreateMeetingInput, CreateInstantMeetingInput, AttendanceInput } from '../types';

type MeetingUpdate = Database['public']['Tables']['meetings']['Update'];

// ─── Queries ────────────────────────────────────────────────────────────────

export async function fetchPendingMeetingsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  return count ?? 0;
}

export async function fetchMeetings(userId: string, _partnerId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .or(`created_by.eq.${userId},partner_id.eq.${userId}`)
    .order('scheduled_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchMeetingTimer(
  userId: string,
  partnerId: string,
): Promise<MeetingTimer | null> {
  const user1 = userId < partnerId ? userId : partnerId;
  const user2 = userId < partnerId ? partnerId : userId;
  const yearMonth = new Date().toISOString().slice(0, 7);

  const { data, error } = await supabase
    .from('meeting_timer')
    .select('*')
    .eq('user1_id', user1)
    .eq('user2_id', user2)
    .eq('year_month', yearMonth)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createMeeting(
  input: CreateMeetingInput,
  createdBy: string,
  partnerId: string,
): Promise<Meeting> {
  const scheduledAt = new Date(`${input.scheduled_date}T${input.scheduled_time}:00`).toISOString();

  const { data, error } = await supabase
    .from('meetings')
    .insert({
      created_by: createdBy,
      partner_id: partnerId,
      scheduled_at: scheduledAt,
      duration_estimate_minutes: input.duration_estimate_minutes,
      location: input.is_video_call ? null : input.location || null,
      is_video_call: input.is_video_call,
      topic: input.topic,
      topic_category: input.topic_category,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  const meeting = data;

  // Crear sala Daily.co si es videollamada
  if (input.is_video_call) {
    try {
      const room = await createDailyRoom(meeting.id);
      const { error: updateErr } = await supabase
        .from('meetings')
        .update({ video_room_url: room.roomUrl, daily_room_name: room.roomName })
        .eq('id', meeting.id);
      if (updateErr) console.error('Error guardando sala Daily.co:', updateErr);
      return { ...meeting, video_room_url: room.roomUrl, daily_room_name: room.roomName };
    } catch (e) {
      console.error('Error creando sala Daily.co:', e);
    }
  }

  return meeting;
}

export async function createInstantMeeting(
  input: CreateInstantMeetingInput,
  createdBy: string,
  partnerId: string,
): Promise<Meeting> {
  const scheduledAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('meetings')
    .insert({
      created_by: createdBy,
      partner_id: partnerId,
      scheduled_at: scheduledAt,
      duration_estimate_minutes: input.duration_estimate_minutes,
      location: null,
      is_video_call: input.is_video_call,
      topic: input.topic,
      topic_category: input.topic_category,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  const meeting = data;

  if (input.is_video_call) {
    try {
      const room = await createDailyRoom(meeting.id);
      const { error: updateErr } = await supabase
        .from('meetings')
        .update({ video_room_url: room.roomUrl, daily_room_name: room.roomName })
        .eq('id', meeting.id);
      if (updateErr) console.error('Error guardando sala Daily.co:', updateErr);
      return { ...meeting, video_room_url: room.roomUrl, daily_room_name: room.roomName };
    } catch (e) {
      console.error('Error creando sala Daily.co:', e);
    }
  }

  return meeting;
}

export async function confirmMeeting(meetingId: string): Promise<void> {
  const { error } = await supabase
    .from('meetings')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', meetingId);

  if (error) throw error;
}

export async function rejectMeeting(meetingId: string): Promise<void> {
  const { error } = await supabase
    .from('meetings')
    .update({ status: 'rejected' })
    .eq('id', meetingId);

  if (error) throw error;
}

export async function cancelMeeting(meetingId: string): Promise<void> {
  const { error } = await supabase
    .from('meetings')
    .update({ status: 'cancelled' })
    .eq('id', meetingId);

  if (error) throw error;
}

export async function markAttendance(input: AttendanceInput): Promise<void> {
  // Obtener el estado actual de la reunión
  const { data: meeting, error: fetchErr } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', input.meetingId)
    .single();

  if (fetchErr) throw fetchErr;

  const m = meeting;

  const updatePayload: MeetingUpdate = input.iAmCreator
    ? { attended_by_creator: input.iAttended }
    : { attended_by_partner: input.iAttended };

  const newCreatorAttended = input.iAmCreator ? input.iAttended : m.attended_by_creator;
  const newPartnerAttended = input.iAmCreator ? m.attended_by_partner : input.iAttended;

  // Si ambos ya marcaron, resolver el estado final
  // El trigger resolve_meeting_outcome en DB maneja score_events y el cronómetro
  if (newCreatorAttended !== null && newPartnerAttended !== null) {
    const now = new Date().toISOString();

    if (newCreatorAttended && newPartnerAttended) {
      updatePayload.status = 'completed';
      updatePayload.completed_at = now;
      updatePayload.actual_duration_minutes =
        input.actualDurationMinutes ?? m.duration_estimate_minutes;
    } else {
      updatePayload.status = 'missed';
      updatePayload.completed_at = now;
      if (input.actualDurationMinutes) {
        updatePayload.actual_duration_minutes = input.actualDurationMinutes;
      }
    }
  }

  const { error } = await supabase
    .from('meetings')
    .update(updatePayload)
    .eq('id', input.meetingId);

  if (error) throw error;
}

