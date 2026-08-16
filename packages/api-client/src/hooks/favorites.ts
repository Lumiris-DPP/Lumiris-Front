'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
    type UseQueryOptions,
} from '@tanstack/react-query';

import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import type { MarketplaceItem } from '../types/marketplace';

export const favoriteKeys = {
    all: () => ['favorites'] as const,
    list: () => ['favorites', 'list'] as const,
};

export function useFavorites(options?: Omit<UseQueryOptions<MarketplaceItem[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<MarketplaceItem[], Error>({
        queryKey: favoriteKeys.list(),
        queryFn: () => client.favorites.list(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}

export interface ToggleFavoriteVars {
    item: MarketplaceItem;
    favorite: boolean;
}

// Bascule optimiste, à l'inverse de la convention « invalider et attendre » du reste du client :
// un cœur qui met un aller-retour réseau à se remplir se lit comme cassé. Une seule entrée de cache
// pilote le cœur des cartes, celui de la fiche et l'écran de liste.
export function useToggleFavorite(
    options?: Omit<UseMutationOptions<void, Error, ToggleFavoriteVars, { snapshot?: MarketplaceItem[] }>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<void, Error, ToggleFavoriteVars, { snapshot?: MarketplaceItem[] }>({
        mutationFn: ({ item, favorite }) =>
            favorite ? client.favorites.add(item.id) : client.favorites.remove(item.id),
        ...options,
        onMutate: async ({ item, favorite }) => {
            await queryClient.cancelQueries({ queryKey: favoriteKeys.list() });
            const snapshot = queryClient.getQueryData<MarketplaceItem[]>(favoriteKeys.list());
            queryClient.setQueryData<MarketplaceItem[]>(favoriteKeys.list(), (previous = []) =>
                favorite
                    ? [item, ...previous.filter((i) => i.id !== item.id)]
                    : previous.filter((i) => i.id !== item.id),
            );
            return { snapshot };
        },
        onError: (...args) => {
            const snapshot = args[2]?.snapshot;
            if (snapshot) {
                queryClient.setQueryData(favoriteKeys.list(), snapshot);
            }
            return options?.onError?.(...args);
        },
        onSettled: (...args) => {
            void queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
            return options?.onSettled?.(...args);
        },
    });
}
