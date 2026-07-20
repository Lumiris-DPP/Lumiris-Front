'use client';

import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import type { AtelierStatsQuery, AtelierStatsResponse, TrackEventRequest } from '../types/atelier-stats';

import { useApiClient } from '../core/provider';

export const atelierStatsKeys = createKeys('atelier-stats');

export function useAtelierStats(
    query?: AtelierStatsQuery,
    options?: Omit<UseQueryOptions<AtelierStatsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<AtelierStatsResponse, Error>({
        queryKey: atelierStatsKeys.custom('stats', query?.from ?? null, query?.to ?? null),
        queryFn: () => client.atelierStats.getStats(query),
        staleTime: 60 * 1000,
        retry: false,
        ...options,
    });
}

export function useTrackEvent() {
    const client = useApiClient();
    return useMutation<void, Error, TrackEventRequest>({
        mutationFn: (req) => client.events.track(req),
    });
}
