'use client';

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';

import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import type { CheckoutDto } from '../types/subscription';
import type { SellerStatsDto, SellerStatusDto } from '../types/seller';

export const sellerKeys = {
    status: () => ['seller', 'status'] as const,
    stats: () => ['seller', 'stats'] as const,
};

export function useSellerStatus(options?: Omit<UseQueryOptions<SellerStatusDto, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<SellerStatusDto, Error>({
        queryKey: sellerKeys.status(),
        queryFn: () => client.seller.status(),
        staleTime: CACHE_TIMES.REALTIME,
        ...options,
    });
}

// Le caller redirige vers l'URL d'onboarding hébergée renvoyée (redirection Stripe).
export function useStartSellerOnboarding(options?: Omit<UseMutationOptions<CheckoutDto, Error, void>, 'mutationFn'>) {
    const client = useApiClient();
    return useMutation<CheckoutDto, Error, void>({
        mutationFn: () => client.seller.startOnboarding(),
        ...options,
    });
}

// Tableau de bord vendeur : ventes, CA net, garde-robe, vues.
export function useSellerStats(options?: Omit<UseQueryOptions<SellerStatsDto, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<SellerStatsDto, Error>({
        queryKey: sellerKeys.stats(),
        queryFn: () => client.seller.stats(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}

// Le caller ouvre l'URL du tableau de bord Stripe Express renvoyée (solde + virements).
export function useSellerDashboardLink(options?: Omit<UseMutationOptions<CheckoutDto, Error, void>, 'mutationFn'>) {
    const client = useApiClient();
    return useMutation<CheckoutDto, Error, void>({
        mutationFn: () => client.seller.dashboardLink(),
        ...options,
    });
}
