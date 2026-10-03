'use client';

import { useMemo } from 'react';
import { useMarketplaceSearch } from '@lumiris/api-client/react';
import {
    applyBoutiqueFilters,
    categoryOptionsOf,
    materialOptionsOf,
    priceBoundsOf,
    sellableItems,
    type BoutiqueFiltersState,
} from '../models/filters-model';

/** Lit le catalogue pour les filtres donnés et rend les pièces filtrées, les facettes et l'état de la lecture. */
export function useBoutiqueCatalogue(filters: BoutiqueFiltersState) {
    const query = filters.q.trim();

    // Deux requêtes, et c'est délibéré : les facettes et les bornes de prix dérivent du catalogue
    // ENTIER. Les faire dériver du résultat textuel ferait disparaître les puces à mesure qu'on tape
    // et sauter les bornes du curseur sous le doigt, avec une sélection de prix devenue hors bornes.
    // Le spread conditionnel garde la MÊME clé TanStack quand la recherche est vide : une requête.
    const catalogue = useMarketplaceSearch({ sort: filters.sort });
    const results = useMarketplaceSearch(
        { sort: filters.sort, ...(query ? { q: query } : {}) },
        { placeholderData: (previous) => previous },
    );

    const found = useMemo(() => sellableItems(results.data?.items ?? []), [results.data]);
    const facetSource = useMemo(() => sellableItems(catalogue.data?.items ?? []), [catalogue.data]);
    const facets = useMemo(
        () => ({
            priceBounds: priceBoundsOf(facetSource),
            categoryOptions: categoryOptionsOf(facetSource),
            materialOptions: materialOptionsOf(facetSource),
        }),
        [facetSource],
    );
    const items = useMemo(() => applyBoutiqueFilters(found, filters), [found, filters]);

    return {
        query,
        items,
        ...facets,
        isLoading: results.isLoading || catalogue.isLoading,
        isError: results.isError || catalogue.isError,
        retry: () => {
            void catalogue.refetch();
            if (query) void results.refetch();
        },
    };
}
