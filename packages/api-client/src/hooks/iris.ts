'use client';

import type { UseQueryOptions } from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import { useStaticQuery } from '../core/query';
import { useApiClient } from '../core/provider';
import type { IrisMethodology } from '../types/iris';

export const irisKeys = createKeys('iris');

/**
 * Méthodologie de calcul du score Iris. Contenu quasi immuable : preset `static`
 * (30 min de staleTime), conservé 24 h en cache pour éviter tout refetch entre
 * deux ouvertures de la popover.
 */
export function useIrisMethodology(options?: Omit<UseQueryOptions<IrisMethodology, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useStaticQuery<IrisMethodology>(irisKeys.custom('methodology'), () => client.iris.methodology(), {
        gcTime: 24 * 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        ...options,
    });
}
