import { supabase } from '@/lib/supabase';
import type { Message, SendMessagePayload } from '../types';

export async function fetchMessages(
  partnerId: string,
  limit = 60,
  before?: string,
): Promise<Message[]> {
  let q = supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    q = q.lt('created_at', before);
  }

  const { data, error } = await q;
  if (error) throw error;
  // Reverse DESC result so each page is in ascending (oldest-first) order
  return data.reverse();
}

export async function sendMessage(payload: SendMessagePayload): Promise<Message> {
  const { data: { session } } = await supabase.auth.getSession();
  const senderId = session?.user.id;
  if (!senderId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: payload.receiverId,
      type: payload.type,
      content: payload.content,
      file_name: payload.fileName ?? null,
      file_size: payload.fileSize ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markAsRead(messageIds: string[]): Promise<void> {
  if (messageIds.length === 0) return;
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .in('id', messageIds)
    .is('read_at', null);
}

export async function fetchUnreadCount(): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession();
  const myId = session?.user.id;
  if (!myId) return 0;

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', myId)
    .is('read_at', null);

  return count ?? 0;
}
