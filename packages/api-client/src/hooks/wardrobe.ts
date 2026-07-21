'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import type { WardrobeItemDto } from '../types/wardrobe';
import type { OrderGroup, OrderResponse } from '../types/marketplace';

export const wardrobeKeys = {
    list: () => ['wardrobe', 'list'] as const,
    orders: () => ['wardrobe', 'orders'] as const,
    orderGroup: (paymentIntentId: string) => ['wardrobe', 'order-group', paymentIntentId] as const,
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

// Commandes d'achat direct de l'acheteur (les plus récentes d'abord). Alimente l'historique
// « Mes commandes » ; chaque ligne porte son `paymentIntentId` pour ouvrir le groupe complet.
export function useMyOrders(options?: Omit<UseQueryOptions<OrderResponse[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<OrderResponse[], Error>({
        queryKey: wardrobeKeys.orders(),
        queryFn: () => client.wardrobe.orders(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}

// Groupe de commande (toutes les lignes d'un même PaymentIntent) + total réellement facturé.
// Utilisé par l'écran de confirmation, qui peut poller jusqu'à ce que le statut passe à PAID
// (webhook Stripe). La query reste désactivée tant qu'aucun paymentIntentId n'est fourni.
export function useOrderGroup(
    paymentIntentId?: string | null,
    options?: Omit<UseQueryOptions<OrderGroup, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<OrderGroup, Error>({
        queryKey: wardrobeKeys.orderGroup(paymentIntentId ?? ''),
        queryFn: () => client.wardrobe.orderGroup(paymentIntentId as string),
        enabled: Boolean(paymentIntentId),
        staleTime: CACHE_TIMES.DETAIL,
        ...options,
    });
}
