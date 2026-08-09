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
import type { DisputeResolutionInput } from '../modules/disputes';
import type { ReasonInput, SellerOrder } from '../types/orders';

export const disputeKeys = {
    all: () => ['disputes'] as const,
    open: () => ['disputes', 'open'] as const,
};

export function useOpenDisputes(options?: Omit<UseQueryOptions<SellerOrder[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<SellerOrder[], Error>({
        queryKey: disputeKeys.open(),
        queryFn: () => client.disputes.listOpen(),
        staleTime: CACHE_TIMES.REALTIME,
        ...options,
    });
}

export interface ResolveDisputeVars {
    orderId: string;
    input: DisputeResolutionInput;
}

export function useResolveDispute(options?: Omit<UseMutationOptions<void, Error, ResolveDisputeVars>, 'mutationFn'>) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<void, Error, ResolveDisputeVars>({
        mutationFn: ({ orderId, input }) => client.disputes.resolve(orderId, input),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: disputeKeys.all() });
            return options?.onSuccess?.(...args);
        },
    });
}

export interface DisputeMessageVars {
    orderId: string;
    input: ReasonInput;
}

// Message de la plateforme dans le fil de la commande — les deux parties sont notifiées.
export function usePostDisputeMessage(
    options?: Omit<UseMutationOptions<void, Error, DisputeMessageVars>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<void, Error, DisputeMessageVars>({
        mutationFn: ({ orderId, input }) => client.disputes.postMessage(orderId, input),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: disputeKeys.all() });
            return options?.onSuccess?.(...args);
        },
    });
}
