'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
    type UseQueryOptions,
} from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import { isApiError } from '../core/errors';
import type {
    ArtisanPhotoResponse,
    ArtisanProfileResponse,
    ArtisanRegisterRequest,
    ArtisanVitrineUpdateRequest,
} from '../types/artisans';

import { useApiClient } from '../core/provider';

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

export function useUpdateArtisanVitrine(
    options?: Omit<UseMutationOptions<ArtisanProfileResponse, Error, ArtisanVitrineUpdateRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<ArtisanProfileResponse, Error, ArtisanVitrineUpdateRequest>({
        mutationFn: (req) => client.artisans.updateProfile(req),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(artisanKeys.custom('me'), args[0]);
            return options?.onSuccess?.(...args);
        },
    });
}

export function useAddArtisanPhoto(
    options?: Omit<UseMutationOptions<ArtisanPhotoResponse, Error, File>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useMutation<ArtisanPhotoResponse, Error, File>({
        mutationFn: (file) => client.artisans.addPhoto(file),
        ...options,
    });
}

export function useRemoveArtisanPhoto(options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>) {
    const client = useApiClient();
    return useMutation<void, Error, string>({
        mutationFn: (photoId) => client.artisans.removePhoto(photoId),
        ...options,
    });
}

export function usePublishArtisanVitrine(
    options?: Omit<UseMutationOptions<ArtisanProfileResponse, Error, void>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<ArtisanProfileResponse, Error, void>({
        mutationFn: () => client.artisans.publish(),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(artisanKeys.custom('me'), args[0]);
            return options?.onSuccess?.(...args);
        },
    });
}
