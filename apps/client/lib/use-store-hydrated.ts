'use client';

import { useEffect, useState } from 'react';

interface PersistedStore {
    persist: {
        hasHydrated: () => boolean;
        onFinishHydration: (fn: () => void) => () => void;
    };
}

/**
 * Builds a hook reporting whether a persisted Zustand store has finished
 * hydrating from storage. Shared so every store's hydration gate behaves
 * identically (false until the first client commit, then subscribe).
 *
 * Le drapeau ne peut PAS partir de `hasHydrated()` : au premier rendu client,
 * React sert le snapshot serveur du store (`useSyncExternalStore` appelle
 * `getServerSnapshot` pendant l'hydratation) alors que le store, lui, a déjà lu
 * localStorage. Le gate passerait donc à `true` sur un état encore vide, et un
 * garde de route conclurait « pas de session » sur chaque F5 ou lien direct.
 */
export function makeHydratedHook(store: PersistedStore): () => boolean {
    return function useHydrated(): boolean {
        const [hydrated, setHydrated] = useState(false);

        useEffect(() => {
            if (store.persist.hasHydrated()) {
                setHydrated(true);
                return;
            }
            return store.persist.onFinishHydration(() => setHydrated(true));
        }, []);

        return hydrated;
    };
}
