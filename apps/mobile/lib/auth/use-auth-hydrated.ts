'use client';

import { useEffect, useState } from 'react';

/**
 * Faux jusqu'au premier commit client. `useUser` lit la session via `useSyncExternalStore`, dont
 * le `getServerSnapshot` vaut `null` : au rendu d'hydratation, une session valide se présente
 * donc comme absente. Un garde de route qui redirige dans un effet part alors sur `/auth` avant
 * que la vraie session soit lue — d'où un accès direct par URL impossible sur les écrans
 * authentifiés, alors que la navigation interne fonctionne.
 */
export function useAuthHydrated(): boolean {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    return hydrated;
}
