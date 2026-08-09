'use client';

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';

import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import type { Notification } from '../types/notifications';

export const notificationKeys = {
    all: () => ['notifications'] as const,
    list: () => ['notifications', 'list'] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
};

// Une transition de commande peut survenir à tout moment côté serveur : la liste se rafraîchit
// donc d'elle-même plutôt que d'attendre une action de l'utilisateur.
export function useNotifications(options?: Omit<UseQueryOptions<Notification[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<Notification[], Error>({
        queryKey: notificationKeys.list(),
        queryFn: () => client.notifications.list(),
        staleTime: CACHE_TIMES.REALTIME,
        refetchInterval: CACHE_TIMES.REALTIME,
        ...options,
    });
}

export function useMarkNotificationsRead() {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<void, Error, string | undefined>({
        mutationFn: (id) => (id ? client.notifications.markRead(id) : client.notifications.markAllRead()),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: notificationKeys.all() });
        },
    });
}
