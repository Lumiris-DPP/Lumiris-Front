'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import type { WebVitalPayload } from '../telemetry';

import { useApiClient } from './client-context';

export function useWebVital(options?: Omit<UseMutationOptions<void, Error, WebVitalPayload>, 'mutationFn'>) {
    const client = useApiClient();
    return useMutation<void, Error, WebVitalPayload>({
        mutationFn: (payload) => client.telemetry.webVital(payload),
        meta: { suppressGlobalError: true },
        ...options,
    });
}
