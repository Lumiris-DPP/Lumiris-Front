'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
    type UseQueryOptions,
} from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import { CACHE_TIMES } from '../core/cache';
import type { DppFormDto, DppFormPayload, DppFormSummaryDto } from '../types/dpp';

import { useApiClient } from '../core/provider';
import { subscriptionKeys } from './subscription';

export const dppKeys = createKeys('dpp');

export function useDppForms(options?: Omit<UseQueryOptions<DppFormSummaryDto[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<DppFormSummaryDto[], Error>({
        queryKey: dppKeys.list(),
        queryFn: () => client.dpp.list(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}

export function useDppForm(id: string, options?: Omit<UseQueryOptions<DppFormDto, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<DppFormDto, Error>({
        queryKey: dppKeys.detail(id),
        queryFn: () => client.dpp.get(id),
        staleTime: CACHE_TIMES.DETAIL,
        ...options,
    });
}

export function useCreateDppForm(options?: Omit<UseMutationOptions<DppFormDto, Error, DppFormPayload>, 'mutationFn'>) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<DppFormDto, Error, DppFormPayload>({
        mutationFn: (payload) => client.dpp.create(payload),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: dppKeys.all });
            // Creating a passport consumes quota → refresh subscription state for the badge.
            void queryClient.invalidateQueries({ queryKey: subscriptionKeys.state() });
            return options?.onSuccess?.(...args);
        },
    });
}
