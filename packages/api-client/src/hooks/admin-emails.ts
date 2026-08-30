'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import { useApiClient } from '../core/provider';
import { useListQuery } from '../core/query';
import type { AdminEmailListParams } from '../modules/admin-emails';
import type { EmailOutboxResponse } from '../types/admin-emails';

export const adminEmailKeys = createKeys('admin-emails');

export function useAdminEmailsList(params: AdminEmailListParams = {}) {
    const client = useApiClient();
    return useListQuery<EmailOutboxResponse[]>(adminEmailKeys.list(params), () => client.adminEmails.list(params));
}

export function useRetryEmail(options?: Omit<UseMutationOptions<EmailOutboxResponse, Error, string>, 'mutationFn'>) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<EmailOutboxResponse, Error, string>({
        mutationFn: (id) => client.adminEmails.retry(id),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: adminEmailKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}
