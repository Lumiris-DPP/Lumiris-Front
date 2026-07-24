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
    DppAccessToken,
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

/** Les trois QR du passeport. Dérivés du code public, donc stables : ils ne s'invalident jamais. */
export function useDppAccessTokens(
    id: string,
    options?: Omit<UseQueryOptions<DppAccessToken[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<DppAccessToken[], Error>({
        queryKey: dppKeys.custom('access-tokens', id),
        queryFn: () => client.dpp.listAccessTokens(id),
        staleTime: CACHE_TIMES.DETAIL,
        ...options,
    });
}

export interface CreateDppFormVars {
    payload: DppFormPayload;
    files?: Partial<Record<DppFilePart, File>>;
    // When true, saves as a DRAFT: no QR code, no frozen hash, no Iris score, no anchor, no quota use.
    draft?: boolean;
}

export function useCreateDppForm(
    options?: Omit<UseMutationOptions<DppFormCreatedDto, Error, CreateDppFormVars>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<DppFormCreatedDto, Error, CreateDppFormVars>({
        mutationFn: ({ payload, files, draft }) => client.dpp.create(payload, files, draft),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: dppKeys.all });
            // Publishing consumes quota → refresh subscription state for the badge.
            void queryClient.invalidateQueries({ queryKey: subscriptionKeys.state() });
            return options?.onSuccess?.(...args);
        },
    });
}

export interface UpdateDppFormVars {
    id: string;
    payload: DppFormPayload;
    files?: Partial<Record<DppFilePart, File>>;
}

export function useUpdateDppForm(
    options?: Omit<UseMutationOptions<DppFormCreatedDto, Error, UpdateDppFormVars>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<DppFormCreatedDto, Error, UpdateDppFormVars>({
        mutationFn: ({ id, payload, files }) => client.dpp.update(id, payload, files),
        ...options,
        onSuccess: (data, vars, ...rest) => {
            void queryClient.invalidateQueries({ queryKey: dppKeys.all });
            void queryClient.invalidateQueries({ queryKey: dppKeys.detail(vars.id) });
            return options?.onSuccess?.(data, vars, ...rest);
        },
    });
}

export function useDeleteDppForm(options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: (id) => client.dpp.remove(id),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: dppKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}

export function usePublishDppForm(options?: Omit<UseMutationOptions<DppFormCreatedDto, Error, string>, 'mutationFn'>) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<DppFormCreatedDto, Error, string>({
        mutationFn: (id) => client.dpp.publish(id),
        ...options,
        onSuccess: (data, id, ...rest) => {
            void queryClient.invalidateQueries({ queryKey: dppKeys.all });
            void queryClient.invalidateQueries({ queryKey: dppKeys.detail(id) });
            // Publishing consumes quota → refresh subscription state for the badge.
            void queryClient.invalidateQueries({ queryKey: subscriptionKeys.state() });
            return options?.onSuccess?.(data, id, ...rest);
        },
    });
}
