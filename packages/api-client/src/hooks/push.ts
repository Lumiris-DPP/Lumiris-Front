'use client';

import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import type { PushSubscriptionPayload } from '../types/push';

export const pushKeys = {
    vapidPublicKey: () => ['push', 'vapid-public-key'] as const,
};

// Vide si Web Push n'est pas configuré côté back — le front doit traiter '' comme indisponible.
export function useVapidPublicKey(options?: Omit<UseQueryOptions<string, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<string, Error>({
        queryKey: pushKeys.vapidPublicKey(),
        queryFn: () => client.push.vapidPublicKey(),
        staleTime: CACHE_TIMES.STATIC,
        ...options,
    });
}

export function usePushSubscribe() {
    const client = useApiClient();
    return useMutation<void, Error, PushSubscriptionPayload>({
        mutationFn: (payload) => client.push.subscribe(payload),
    });
}

export function usePushUnsubscribe() {
    const client = useApiClient();
    return useMutation<void, Error, string>({
        mutationFn: (endpoint) => client.push.unsubscribe(endpoint),
    });
}
