'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import type { WardrobeItemDto } from '../types/wardrobe';

export const wardrobeKeys = {
    list: () => ['wardrobe', 'list'] as const,
};

export function useWardrobe(options?: Omit<UseQueryOptions<WardrobeItemDto[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<WardrobeItemDto[], Error>({
        queryKey: wardrobeKeys.list(),
        queryFn: () => client.wardrobe.list(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}
