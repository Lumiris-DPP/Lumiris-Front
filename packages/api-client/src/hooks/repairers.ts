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
    RepairAppointmentRequest,
    RepairerProfileResponse,
    RepairerProfileUpdateRequest,
    RepairerPublicProfileResponse,
    RepairerRegisterRequest,
    RepairerReviewRequest,
    RepairerReviewResponse,
    RepairerSearchQuery,
    RepairerSearchResult,
    RepairMessageRequest,
    RepairMessageResponse,
    RepairQuoteRequest,
    RepairRequestCreateRequest,
    RepairRequestResponse,
} from '../types/repairers';
import type { KybDetailsRequest, KybDocumentLabel } from '../types/kyb';

import { useApiClient } from '../core/provider';

export const repairerKeys = createKeys('repairer');
export const repairRequestKeys = createKeys('repair-request');

// --- Repairer profile (authenticated repairer) ---

export function useRepairerMe(options?: Omit<UseQueryOptions<RepairerProfileResponse, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<RepairerProfileResponse, Error>({
        queryKey: repairerKeys.custom('me'),
        queryFn: () => client.repairers.me(),
        staleTime: 60 * 1000,
        ...options,
    });
}

export function useRegisterRepairer(
    options?: Omit<UseMutationOptions<RepairerProfileResponse, Error, RepairerRegisterRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairerProfileResponse, Error, RepairerRegisterRequest>({
        mutationFn: (req) => client.repairers.register(req),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(repairerKeys.custom('me'), args[0]);
            return options?.onSuccess?.(...args);
        },
    });
}

export function useUpdateRepairerProfile(
    options?: Omit<UseMutationOptions<RepairerProfileResponse, Error, RepairerProfileUpdateRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairerProfileResponse, Error, RepairerProfileUpdateRequest>({
        mutationFn: (req) => client.repairers.updateProfile(req),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(repairerKeys.custom('me'), args[0]);
            return options?.onSuccess?.(...args);
        },
    });
}

export function useSubmitRepairerKyb(
    options?: Omit<UseMutationOptions<RepairerProfileResponse, Error, KybDetailsRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairerProfileResponse, Error, KybDetailsRequest>({
        mutationFn: (req) => client.repairers.submitKyb(req),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(repairerKeys.custom('me'), args[0]);
            return options?.onSuccess?.(...args);
        },
    });
}

export function useUploadRepairerKybDocument(
    options?: Omit<
        UseMutationOptions<RepairerProfileResponse, Error, { label: KybDocumentLabel; file: File }>,
        'mutationFn'
    >,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairerProfileResponse, Error, { label: KybDocumentLabel; file: File }>({
        mutationFn: ({ label, file }) => client.repairers.uploadKybDocument(label, file),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(repairerKeys.custom('me'), args[0]);
            return options?.onSuccess?.(...args);
        },
    });
}

// --- Public repairer directory (VISION) ---

export function useRepairerPublicProfile(
    id: string | undefined,
    options?: Omit<UseQueryOptions<RepairerPublicProfileResponse, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<RepairerPublicProfileResponse, Error>({
        queryKey: repairerKeys.custom('public', id ?? null),
        queryFn: () => client.repairers.getPublicById(id as string),
        enabled: Boolean(id),
        staleTime: 60 * 1000,
        ...options,
    });
}

export function useRepairerSearch(
    query: RepairerSearchQuery | undefined,
    options?: Omit<UseQueryOptions<RepairerSearchResult[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<RepairerSearchResult[], Error>({
        queryKey: repairerKeys.custom(
            'search',
            query?.lat ?? null,
            query?.lng ?? null,
            query?.specialty ?? null,
            query?.radiusKm ?? null,
        ),
        queryFn: () => client.repairers.search(query as RepairerSearchQuery),
        enabled: Boolean(query),
        staleTime: 30 * 1000,
        ...options,
    });
}

export function useRepairerReviews(
    repairerId: string | undefined,
    options?: Omit<UseQueryOptions<RepairerReviewResponse[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<RepairerReviewResponse[], Error>({
        queryKey: repairerKeys.custom('reviews', repairerId ?? null),
        queryFn: () => client.repairers.getReviews(repairerId as string),
        enabled: Boolean(repairerId),
        ...options,
    });
}

export function useAddRepairerReview(
    repairerId: string,
    options?: Omit<UseMutationOptions<RepairerReviewResponse, Error, RepairerReviewRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairerReviewResponse, Error, RepairerReviewRequest>({
        mutationFn: (req) => client.repairers.addReview(repairerId, req),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: repairerKeys.custom('reviews', repairerId) });
            queryClient.invalidateQueries({ queryKey: repairerKeys.custom('public', repairerId) });
            return options?.onSuccess?.(...args);
        },
    });
}

// --- Repairer-side incoming requests ---

export function useRepairerRequests(
    options?: Omit<UseQueryOptions<RepairRequestResponse[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<RepairRequestResponse[], Error>({
        queryKey: repairerKeys.custom('requests'),
        queryFn: () => client.repairers.myRequests(),
        staleTime: 15 * 1000,
        ...options,
    });
}

export function useSubmitQuote(
    options?: Omit<
        UseMutationOptions<RepairRequestResponse, Error, { requestId: string; req: RepairQuoteRequest }>,
        'mutationFn'
    >,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairRequestResponse, Error, { requestId: string; req: RepairQuoteRequest }>({
        mutationFn: ({ requestId, req }) => client.repairers.submitQuote(requestId, req),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: repairerKeys.custom('requests') });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useStartRepair(options?: Omit<UseMutationOptions<RepairRequestResponse, Error, string>, 'mutationFn'>) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairRequestResponse, Error, string>({
        mutationFn: (requestId) => client.repairers.startRepair(requestId),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: repairerKeys.custom('requests') });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useCompleteRepair(
    options?: Omit<UseMutationOptions<RepairRequestResponse, Error, string>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairRequestResponse, Error, string>({
        mutationFn: (requestId) => client.repairers.completeRepair(requestId),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: repairerKeys.custom('requests') });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useRepairerMessages(
    requestId: string | undefined,
    options?: Omit<UseQueryOptions<RepairMessageResponse[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<RepairMessageResponse[], Error>({
        queryKey: repairerKeys.custom('messages', requestId ?? null),
        queryFn: () => client.repairers.repairerMessages(requestId as string),
        enabled: Boolean(requestId),
        refetchInterval: 10 * 1000,
        ...options,
    });
}

export function useSendRepairerMessage(
    requestId: string,
    options?: Omit<UseMutationOptions<RepairMessageResponse, Error, RepairMessageRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairMessageResponse, Error, RepairMessageRequest>({
        mutationFn: (req) => client.repairers.sendRepairerMessage(requestId, req),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: repairerKeys.custom('messages', requestId) });
            return options?.onSuccess?.(...args);
        },
    });
}

// --- Consumer-side repair requests (VISION) ---

export function useCreateRepairRequest(
    options?: Omit<UseMutationOptions<RepairRequestResponse, Error, RepairRequestCreateRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairRequestResponse, Error, RepairRequestCreateRequest>({
        mutationFn: (req) => client.repairRequests.create(req),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: repairRequestKeys.custom('mine') });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useMyRepairRequests(
    options?: Omit<UseQueryOptions<RepairRequestResponse[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<RepairRequestResponse[], Error>({
        queryKey: repairRequestKeys.custom('mine'),
        queryFn: () => client.repairRequests.mine(),
        staleTime: 15 * 1000,
        ...options,
    });
}

export function useAcceptQuote(
    options?: Omit<
        UseMutationOptions<RepairRequestResponse, Error, { requestId: string; req: RepairAppointmentRequest }>,
        'mutationFn'
    >,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairRequestResponse, Error, { requestId: string; req: RepairAppointmentRequest }>({
        mutationFn: ({ requestId, req }) => client.repairRequests.acceptQuote(requestId, req),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: repairRequestKeys.custom('mine') });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useRefuseQuote(options?: Omit<UseMutationOptions<RepairRequestResponse, Error, string>, 'mutationFn'>) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairRequestResponse, Error, string>({
        mutationFn: (requestId) => client.repairRequests.refuseQuote(requestId),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: repairRequestKeys.custom('mine') });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useCancelRepairRequest(
    options?: Omit<UseMutationOptions<RepairRequestResponse, Error, string>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairRequestResponse, Error, string>({
        mutationFn: (requestId) => client.repairRequests.cancel(requestId),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: repairRequestKeys.custom('mine') });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useRepairMessages(
    requestId: string | undefined,
    options?: Omit<UseQueryOptions<RepairMessageResponse[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<RepairMessageResponse[], Error>({
        queryKey: repairRequestKeys.custom('messages', requestId ?? null),
        queryFn: () => client.repairRequests.messages(requestId as string),
        enabled: Boolean(requestId),
        refetchInterval: 10 * 1000,
        ...options,
    });
}

export function useSendMessage(
    requestId: string,
    options?: Omit<UseMutationOptions<RepairMessageResponse, Error, RepairMessageRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<RepairMessageResponse, Error, RepairMessageRequest>({
        mutationFn: (req) => client.repairRequests.sendMessage(requestId, req),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: repairRequestKeys.custom('messages', requestId) });
            return options?.onSuccess?.(...args);
        },
    });
}
