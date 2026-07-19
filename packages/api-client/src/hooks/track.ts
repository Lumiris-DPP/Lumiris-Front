'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { useApiClient } from '../core/provider';
import type { AffiliateTrackInput } from '../types/marketplace';

// Clic d'affiliation externe (fire-and-forget). L'échec réseau ne remonte pas :
// la redirection vers l'atelier ne doit jamais être bloquée par le tracking.
export function useTrackAffiliate(options?: Omit<UseMutationOptions<void, Error, AffiliateTrackInput>, 'mutationFn'>) {
    const client = useApiClient();
    return useMutation<void, Error, AffiliateTrackInput>({
        mutationFn: (input) => client.track.affiliate(input),
        ...options,
        // Fire-and-forget : l'échec ne doit jamais remonter à l'UI via le MutationCache global.
        meta: { suppressGlobalError: true, ...options?.meta },
    });
}
