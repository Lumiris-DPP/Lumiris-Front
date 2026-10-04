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

// Charge le catalogue et applique la recherche et les filtres.
export function useBoutiqueCatalogue(filters: BoutiqueFiltersState) {
    const query = filters.q.trim();

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
