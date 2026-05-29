import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  fetchMessages,
  fetchUnreadCount,
  markAsRead,
  sendMessage,
} from '../services/messageService';
import { useRealtimeChat } from './useRealtimeChat';
import type { Message, SendMessagePayload } from '../types';

export function useMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const partnerId = user?.partner_id ?? null;
  const myId = user?.id;

  const query = useQuery({
    queryKey: ['messages', partnerId],
    queryFn: () => fetchMessages(partnerId!),
    enabled: !!partnerId,
    staleTime: Infinity,
  });

  // Mark incoming messages as read immediately when the chat is open
  useEffect(() => {
    if (!query.data) return;
    const unread = query.data
      .filter((m) => m.receiver_id === myId && !m.read_at)
      .map((m) => m.id);
    if (unread.length > 0) {
      void markAsRead(unread).then(() => {
        void queryClient.invalidateQueries({ queryKey: ['unread_count', myId] });
      });
    }
  }, [query.data, myId, queryClient]);

  // Append messages received via Realtime
  useRealtimeChat(
    myId,
    useCallback(
      (newMsg: Message) => {
        queryClient.setQueryData<Message[]>(['messages', partnerId], (prev) =>
          prev ? [...prev, newMsg] : [newMsg],
        );
        // Auto-mark as read since we're on the chat page
        void markAsRead([newMsg.id]).then(() => {
          void queryClient.invalidateQueries({ queryKey: ['unread_count', myId] });
        });
      },
      [queryClient, partnerId, myId],
    ),
  );

  const sendMutation = useMutation({
    mutationFn: (payload: Omit<SendMessagePayload, 'receiverId'>) =>
      sendMessage({ ...payload, receiverId: partnerId! }),
    onMutate: async (payload) => {
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        sender_id: myId!,
        receiver_id: partnerId!,
        type: payload.type,
        content: payload.content,
        file_name: payload.fileName ?? null,
        file_size: payload.fileSize ?? null,
        read_at: null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Message[]>(['messages', partnerId], (prev) =>
        prev ? [...prev, tempMsg] : [tempMsg],
      );
      return { tempId: tempMsg.id };
    },
    onSuccess: (realMsg, _, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData<Message[]>(['messages', partnerId], (prev) =>
        prev?.map((m) => (m.id === context?.tempId ? realMsg : m)) ?? [],
      );
    },
    onError: (_, __, context) => {
      // Remove failed optimistic message
      queryClient.setQueryData<Message[]>(['messages', partnerId], (prev) =>
        prev?.filter((m) => m.id !== context?.tempId) ?? [],
      );
    },
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    send: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    partnerId,
    myId,
  };
}

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['unread_count', user?.id],
    queryFn: fetchUnreadCount,
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
