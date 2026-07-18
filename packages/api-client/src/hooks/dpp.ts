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
import type {
    DppEventDto,
    DppEventPayload,
    DppFilePart,
    DppFormCreatedDto,
    DppFormDto,
    DppFormPayload,
    DppFormSummaryDto,
} from '../types/dpp';

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

export function useDppEvents(
    id: string,
    options?: Omit<UseQueryOptions<DppEventDto[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<DppEventDto[], Error>({
        queryKey: dppKeys.custom('events', id),
        queryFn: () => client.dpp.listEvents(id),
        staleTime: CACHE_TIMES.DETAIL,
        ...options,
    });
}

export function useCreateDppEvent(
    id: string,
    options?: Omit<UseMutationOptions<DppEventDto, Error, DppEventPayload>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<DppEventDto, Error, DppEventPayload>({
        mutationFn: (payload) => client.dpp.createEvent(id, payload),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: dppKeys.custom('events', id) });
            return options?.onSuccess?.(...args);
        },
    });
}

export interface CreateDppFormVars {
    payload: DppFormPayload;
    files?: Partial<Record<DppFilePart, File>>;
}

export function useCreateDppForm(
    options?: Omit<UseMutationOptions<DppFormCreatedDto, Error, CreateDppFormVars>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<DppFormCreatedDto, Error, CreateDppFormVars>({
        mutationFn: ({ payload, files }) => client.dpp.create(payload, files),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: dppKeys.all });
            // Creating a passport consumes quota → refresh subscription state for the badge.
            void queryClient.invalidateQueries({ queryKey: subscriptionKeys.state() });
            return options?.onSuccess?.(...args);
        },
    });
}
