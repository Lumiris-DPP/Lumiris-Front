'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { createKeys } from '../keys';
import type { DownloadUrlRequest, DownloadUrlResponse, UploadUrlRequest, UploadUrlResponse } from '../storage';

import { useApiClient } from './client-context';
import { useDetailQuery } from './queries';

export const storageKeys = {
    ...createKeys('storage'),
    download: (bucket: string, key: string) => ['storage', 'download', bucket, key] as const,
};

export function useUploadUrl(
    options?: Omit<UseMutationOptions<UploadUrlResponse, Error, UploadUrlRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useMutation<UploadUrlResponse, Error, UploadUrlRequest>({
        mutationFn: (req) => client.storage.uploadUrl(req),
        ...options,
    });
}

export function useDownloadUrl(req: DownloadUrlRequest, options?: { enabled?: boolean }) {
    const client = useApiClient();
    const enabled = options?.enabled !== false && Boolean(req.bucket) && Boolean(req.key);
    return useDetailQuery<DownloadUrlResponse>(
        storageKeys.download(req.bucket, req.key),
        () => client.storage.downloadUrl(req),
        { enabled },
    );
}
