'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
    type UseQueryOptions,
} from '@tanstack/react-query';

import { createKeys } from '../keys';
import type { ArtisanProfileResponse, ArtisanRegisterRequest } from '../artisans';
import { isApiError } from '../errors';

import { useApiClient } from './client-context';

export const artisanKeys = createKeys('artisan-profile');

export function useArtisanMe(options?: Omit<UseQueryOptions<ArtisanProfileResponse, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<ArtisanProfileResponse, Error>({
        queryKey: artisanKeys.custom('me'),
        queryFn: () => client.artisans.me(),
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
            if (isApiError(error) && error.code === 'NOT_FOUND') return false;
            return failureCount < 2;
        },
        ...options,
    });
}

export function useArtisanRegister(
    options?: Omit<UseMutationOptions<ArtisanProfileResponse, Error, ArtisanRegisterRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<ArtisanProfileResponse, Error, ArtisanRegisterRequest>({
        mutationFn: (req) => client.artisans.register(req),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(artisanKeys.custom('me'), args[0]);
            return options?.onSuccess?.(...args);
        },
    });
}

export function useSignDeclaration(
    options?: Omit<UseMutationOptions<ArtisanProfileResponse, Error, void>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<ArtisanProfileResponse, Error, void>({
        mutationFn: () => client.artisans.signDeclaration(),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(artisanKeys.custom('me'), args[0]);
            return options?.onSuccess?.(...args);
        },
    });
}
