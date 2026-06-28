'use client';

import { useQuery, type UseQueryOptions, type UseQueryResult, type QueryKey } from '@tanstack/react-query';

import { CACHE_TIMES, type QueryPreset } from './cache';

const QUERY_PRESETS: Record<QueryPreset, { staleTime: number; refetchInterval?: number }> = {
    list: { staleTime: CACHE_TIMES.LIST },
    detail: { staleTime: CACHE_TIMES.DETAIL },
    static: { staleTime: CACHE_TIMES.STATIC },
    realtime: { staleTime: CACHE_TIMES.REALTIME, refetchInterval: CACHE_TIMES.REALTIME },
};

type QueryOptions<TData, TSelect = TData> = Omit<
    UseQueryOptions<TData, Error, TSelect, QueryKey>,
    'queryKey' | 'queryFn'
>;

function usePresetQuery<TData, TSelect = TData>(
    preset: QueryPreset,
    queryKey: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData, TSelect>,
): UseQueryResult<TSelect, Error> {
    return useQuery<TData, Error, TSelect, QueryKey>({
        queryKey,
        queryFn,
        ...QUERY_PRESETS[preset],
        ...options,
    });
}

export function useListQuery<TData, TSelect = TData>(
    queryKey: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData, TSelect>,
): UseQueryResult<TSelect, Error> {
    return usePresetQuery<TData, TSelect>('list', queryKey, queryFn, options);
}

export function useDetailQuery<TData, TSelect = TData>(
    queryKey: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData, TSelect>,
): UseQueryResult<TSelect, Error> {
    return usePresetQuery<TData, TSelect>('detail', queryKey, queryFn, options);
}

export function useStaticQuery<TData, TSelect = TData>(
    queryKey: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData, TSelect>,
): UseQueryResult<TSelect, Error> {
    return usePresetQuery<TData, TSelect>('static', queryKey, queryFn, options);
}

export function useRealtimeQuery<TData, TSelect = TData>(
    queryKey: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData, TSelect>,
): UseQueryResult<TSelect, Error> {
    return usePresetQuery<TData, TSelect>('realtime', queryKey, queryFn, options);
}
