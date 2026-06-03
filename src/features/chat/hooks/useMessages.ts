import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  fetchMessages,
  fetchUnreadCount,
  markAsRead,
  sendMessage,
} from '../services/messageService';
import { useRealtimeChat } from './useRealtimeChat';
import type { Message, SendMessagePayload } from '../types';

type MessagesInfiniteData = InfiniteData<Message[], string | undefined>;

export function useMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const partnerId = user?.partner_id ?? null;
  const myId = user?.id;

  const query = useInfiniteQuery({
    queryKey: ['messages', partnerId],
    queryFn: ({ pageParam }) => fetchMessages(partnerId ?? '', 60, pageParam),
    initialPageParam: undefined as string | undefined,
    // Each page is ascending; [0] = oldest in that page = cursor for next (older) batch
    getNextPageParam: (lastPage) =>
      lastPage.length === 60 ? lastPage[0]?.created_at : undefined,
    enabled: !!partnerId,
    staleTime: Infinity,
    refetchOnMount: 'always',
  });

  // Flatten pages oldest-first: pages[0]=most recent, pages[n]=oldest → reduceRight
  const messages = useMemo(
    () =>
      (query.data?.pages ?? []).reduceRight<Message[]>(
        (acc, page) => [...acc, ...page],
        [],
      ),
    [query.data],
  );

  // Mark incoming messages as read immediately when the chat is open
  useEffect(() => {
    if (!messages.length) return;
    const unread = messages
      .filter((m) => m.receiver_id === myId && !m.read_at)
      .map((m) => m.id);
    if (unread.length > 0) {
      void markAsRead(unread).then(() => {
        void queryClient.invalidateQueries({ queryKey: ['unread_count', myId] });
      });
    }
  }, [messages, myId, queryClient]);

  // Append messages received via Realtime + update read receipts
  useRealtimeChat(
    myId,
    useCallback(
      (newMsg: Message) => {
        queryClient.setQueryData<MessagesInfiniteData>(['messages', partnerId], (prev) => {
          if (!prev) return { pages: [[newMsg]], pageParams: [undefined] };
          const pages: Message[][] = prev.pages;
          const firstPage: Message[] = pages[0] ?? [];
          const rest: Message[][] = pages.slice(1);
          const newPages: Message[][] = [[...firstPage, newMsg], ...rest];
          return { ...prev, pages: newPages };
        });
        void markAsRead([newMsg.id]).then(() => {
          void queryClient.invalidateQueries({ queryKey: ['unread_count', myId] });
        });
      },
      [queryClient, partnerId, myId],
    ),
    useCallback(
      (msgId: string, readAt: string) => {
        queryClient.setQueryData<MessagesInfiniteData>(['messages', partnerId], (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: prev.pages.map((page) =>
              page.map((m) => (m.id === msgId ? { ...m, read_at: readAt } : m)),
            ),
          };
        });
      },
      [queryClient, partnerId],
    ),
  );

  const sendMutation = useMutation({
    mutationFn: (payload: Omit<SendMessagePayload, 'receiverId'>) =>
      sendMessage({ ...payload, receiverId: partnerId ?? '' }),
    onMutate: (payload) => {
      const tempMsg: Message = {
        id: `temp-${String(Date.now())}`,
        sender_id: myId ?? '',
        receiver_id: partnerId ?? '',
        type: payload.type,
        content: payload.content,
        file_name: payload.fileName ?? null,
        file_size: payload.fileSize ?? null,
        read_at: null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<MessagesInfiniteData>(['messages', partnerId], (prev) => {
        if (!prev) return { pages: [[tempMsg]], pageParams: [undefined] };
        const pages: Message[][] = prev.pages;
        const firstPage: Message[] = pages[0] ?? [];
        const rest: Message[][] = pages.slice(1);
        const newPages: Message[][] = [[...firstPage, tempMsg], ...rest];
        return { ...prev, pages: newPages };
      });
      return { tempId: tempMsg.id };
    },
    onSuccess: (realMsg, _, context) => {
      queryClient.setQueryData<MessagesInfiniteData>(['messages', partnerId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page) =>
            page.map((m) => (m.id === context.tempId ? realMsg : m)),
          ),
        };
      });
    },
    onError: (_, __, context) => {
      queryClient.setQueryData<MessagesInfiniteData>(['messages', partnerId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page) =>
            page.filter((m) => m.id !== context?.tempId),
          ),
        };
      });
    },
  });

  return {
    messages,
    isLoading: query.isLoading,
    isError: query.isError,
    send: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    loadMore: query.fetchNextPage,
    hasMore: query.hasNextPage,
    isFetchingMore: query.isFetchingNextPage,
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

/**
 * Suscripción Realtime siempre activa (montada en AppLayout).
 * Invalida el conteo de no leídos en tiempo real cuando llega
 * un mensaje nuevo, sin depender de estar en la página de chat.
 */
export function useRealtimeUnreadBadge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const myId = user?.id;
  const invalidateRef = useRef<() => void>(() => {});

  useEffect(() => {
    invalidateRef.current = () => {
      void queryClient.invalidateQueries({ queryKey: ['unread_count', myId] });
    };
  });

  useEffect(() => {
    if (!myId) return;

    const channel = supabase
      .channel(`unread_badge:${myId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${myId}` },
        () => {
          invalidateRef.current();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [myId]);
}
