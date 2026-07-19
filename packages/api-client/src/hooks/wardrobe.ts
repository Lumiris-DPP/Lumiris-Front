'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import type { OrderDto, WardrobeItemDto } from '../types/wardrobe';

export const wardrobeKeys = {
    list: () => ['wardrobe', 'list'] as const,
    orders: () => ['wardrobe', 'orders'] as const,
};

export function useWardrobe(options?: Omit<UseQueryOptions<WardrobeItemDto[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<WardrobeItemDto[], Error>({
        queryKey: wardrobeKeys.list(),
        queryFn: () => client.wardrobe.list(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}

// Commandes d'achat direct de l'acheteur (les plus récentes d'abord). Utilisé par l'écran
// de confirmation, qui peut poller jusqu'à ce que la commande passe à PAID (webhook).
export function useMyOrders(options?: Omit<UseQueryOptions<OrderDto[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<OrderDto[], Error>({
        queryKey: wardrobeKeys.orders(),
        queryFn: () => client.wardrobe.orders(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}
