'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import type { RepairerProfileResponse } from '../types/repairers';
import type { RejectArtisanRequest } from '../types/admin-artisans';

import { useApiClient } from '../core/provider';
import { useListQuery } from '../core/query';

export const adminRepairerKeys = createKeys('admin-repairers');

export function useAdminRepairersList() {
    const client = useApiClient();
    return useListQuery<RepairerProfileResponse[]>(adminRepairerKeys.list(), () => client.adminRepairers.listPending());
}

export function useAdminRepairersAll() {
    const client = useApiClient();
    return useListQuery<RepairerProfileResponse[]>(adminRepairerKeys.custom('all'), () =>
        client.adminRepairers.listAll(),
    );
}

export function useVerifyRepairer(
    options?: Omit<UseMutationOptions<RepairerProfileResponse, Error, string>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairerProfileResponse, Error, string>({
        mutationFn: (id) => client.adminRepairers.verify(id),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: adminRepairerKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useRejectRepairer(
    options?: Omit<UseMutationOptions<RepairerProfileResponse, Error, { id: string; reason?: string }>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairerProfileResponse, Error, { id: string; reason?: string }>({
        mutationFn: ({ id, reason }) => client.adminRepairers.reject(id, { reason } as RejectArtisanRequest),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: adminRepairerKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useMarkRepairerKybOngoing(
    options?: Omit<UseMutationOptions<RepairerProfileResponse, Error, string>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairerProfileResponse, Error, string>({
        mutationFn: (id) => client.adminRepairers.markOngoing(id),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: adminRepairerKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useMarkRepairerKybIncomplete(
    options?: Omit<UseMutationOptions<RepairerProfileResponse, Error, { id: string; reason?: string }>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairerProfileResponse, Error, { id: string; reason?: string }>({
        mutationFn: ({ id, reason }) => client.adminRepairers.markIncomplete(id, { reason } as RejectArtisanRequest),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: adminRepairerKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}
