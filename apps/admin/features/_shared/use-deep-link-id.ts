'use client';

import { useCallback, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Sélection d'une ligne partageable par URL (`?id=…`).
 *
 * L'URL est réécrite par `history.replaceState` et non par `router.replace` :
 * une navigation Next re-suspend la frontière `<Suspense>` qui entoure tout
 * écran lisant `useSearchParams`, ce qui démonte le sous-arbre et détruit son
 * état — filtres saisis, lignes cochées, décisions de curation en attente.
 * La sélection vit donc en état local, l'URL n'étant qu'un miroir.
 */
export function useDeepLinkId() {
    const params = useSearchParams();
    const pathname = usePathname();
    const [selectedId, setSelected] = useState<string | null>(() => params?.get('id') ?? null);

    const setSelectedId = useCallback(
        (id: string | null) => {
            setSelected(id);
            const next = new URLSearchParams(window.location.search);
            if (id) next.set('id', id);
            else next.delete('id');
            const qs = next.toString();
            window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
        },
        [pathname],
    );

    return { selectedId, setSelectedId } as const;
}
