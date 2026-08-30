'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import { useApiClient } from '../core/provider';
import { useListQuery } from '../core/query';
import type { CertificateLibraryItem, CertificateLibraryType } from '../types/certificate-library';

export const certificateLibraryKeys = createKeys('certificate-library');

export function useCertificateLibrary() {
    const client = useApiClient();
    return useListQuery<CertificateLibraryItem[]>(certificateLibraryKeys.list(), () =>
        client.certificateLibrary.list(),
    );
}

export function useUploadCertificate(
    options?: Omit<
        UseMutationOptions<CertificateLibraryItem, Error, { file: File; type: CertificateLibraryType }>,
        'mutationFn'
    >,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<CertificateLibraryItem, Error, { file: File; type: CertificateLibraryType }>({
        mutationFn: ({ file, type }) => client.certificateLibrary.upload(file, type),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: certificateLibraryKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useDeleteCertificate(options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: (id) => client.certificateLibrary.remove(id),
        ...options,
        onSuccess: (...args) => {
            queryClient.invalidateQueries({ queryKey: certificateLibraryKeys.all });
            return options?.onSuccess?.(...args);
        },
    });
}
