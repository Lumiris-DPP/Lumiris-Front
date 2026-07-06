'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import type { ArtisanProfileResponse } from '../types/artisans';
import type { RejectArtisanRequest } from '../types/admin-artisans';

import { useApiClient } from '../core/provider';
import { useListQuery } from '../core/query';

export const adminArtisanKeys = createKeys('admin-artisans');

export function useAdminArtisansList() {
    const client = useApiClient();
    return useListQuery<ArtisanProfileResponse[]>(adminArtisanKeys.list(), () => client.adminArtisans.listPending());
}

export function useVerifyArtisan(
    options?: Omit<UseMutationOptions<ArtisanProfileResponse, Error, string>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<ArtisanProfileResponse, Error, string>({
        mutationFn: (id) => client.adminArtisans.verify(id),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: adminArtisanKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useRejectArtisan(
    options?: Omit<UseMutationOptions<ArtisanProfileResponse, Error, { id: string; reason?: string }>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<ArtisanProfileResponse, Error, { id: string; reason?: string }>({
        mutationFn: ({ id, reason }) => client.adminArtisans.reject(id, { reason } as RejectArtisanRequest),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: adminArtisanKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}
