'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
    type UseQueryOptions,
} from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import type {
    CoverageGapResponse,
    RepairerDirectoryImportReport,
    RepairerDirectoryImportRequest,
    RepairerProfileResponse,
} from '../types/repairers';
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

// --- Réseau : import annuaire + prospection ---

export function useImportRepairerDirectory(
    options?: Omit<
        UseMutationOptions<RepairerDirectoryImportReport, Error, RepairerDirectoryImportRequest>,
        'mutationFn'
    >,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairerDirectoryImportReport, Error, RepairerDirectoryImportRequest>({
        mutationFn: (req) => client.adminRepairers.importDirectory(req),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: adminRepairerKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useIssueRepairerClaimToken(
    options?: Omit<UseMutationOptions<{ claimToken: string }, Error, string>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useMutation<{ claimToken: string }, Error, string>({
        mutationFn: (id) => client.adminRepairers.issueClaimToken(id),
        ...options,
    });
}

export function useInviteRepairer(
    options?: Omit<UseMutationOptions<void, Error, { id: string; email: string }>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useMutation<void, Error, { id: string; email: string }>({
        mutationFn: ({ id, email }) => client.adminRepairers.invite(id, { email }),
        ...options,
    });
}

export function useRepairerCoverageGaps(
    days = 30,
    options?: Omit<UseQueryOptions<CoverageGapResponse[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<CoverageGapResponse[], Error>({
        queryKey: adminRepairerKeys.custom('coverage-gaps', days),
        queryFn: () => client.adminRepairers.coverageGaps(days),
        staleTime: 5 * 60 * 1000,
        ...options,
    });
}
