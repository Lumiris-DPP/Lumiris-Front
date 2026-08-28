'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import type { WardrobeItemDto } from '../types/wardrobe';

export const wardrobeKeys = {
    all: ['wardrobe'] as const,
    list: (userId: string | null) => ['wardrobe', 'list', userId] as const,
};

export function useWardrobe(
    userId: string | null,
    options?: Omit<UseQueryOptions<WardrobeItemDto[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<WardrobeItemDto[], Error>({
        queryKey: wardrobeKeys.list(userId),
        queryFn: () => client.wardrobe.list(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}
