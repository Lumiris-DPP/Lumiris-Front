'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
    type UseQueryOptions,
} from '@tanstack/react-query';

import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import { orderKeys } from './orders';
import type { CheckoutDto } from '../types/subscription';
import type {
    SellerPayoutSchedule,
    SellerStatsDto,
    SellerStatusDto,
    ShipFromAddress,
    ShipFromAddressInput,
} from '../types/seller';

export const sellerKeys = {
    status: () => ['seller', 'status'] as const,
    stats: () => ['seller', 'stats'] as const,
    payouts: () => ['seller', 'payouts'] as const,
    shipFromAddress: () => ['seller', 'ship-from-address'] as const,
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

// Échéancier de versement : une ligne par vente en cours, la plus proche en tête.
export function useSellerPayouts(options?: Omit<UseQueryOptions<SellerPayoutSchedule, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<SellerPayoutSchedule, Error>({
        queryKey: sellerKeys.payouts(),
        queryFn: () => client.seller.payouts(),
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

// Adresse d'enlèvement de l'atelier (expéditeur des bordereaux).
export function useShipFromAddress(options?: Omit<UseQueryOptions<ShipFromAddress, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<ShipFromAddress, Error>({
        queryKey: sellerKeys.shipFromAddress(),
        queryFn: () => client.seller.shipFromAddress(),
        staleTime: CACHE_TIMES.DETAIL,
        ...options,
    });
}

// La saisie de l'adresse débloque l'impression d'étiquette : on réinvalide aussi la disponibilité
// de l'intégration, sinon l'atelier vient de renseigner son adresse et le bouton reste grisé.
export function useUpdateShipFromAddress(
    options?: Omit<UseMutationOptions<ShipFromAddress, Error, ShipFromAddressInput>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<ShipFromAddress, Error, ShipFromAddressInput>({
        mutationFn: (input) => client.seller.updateShipFromAddress(input),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: sellerKeys.shipFromAddress() });
            void queryClient.invalidateQueries({ queryKey: orderKeys.shipping() });
            return options?.onSuccess?.(...args);
        },
    });
}
