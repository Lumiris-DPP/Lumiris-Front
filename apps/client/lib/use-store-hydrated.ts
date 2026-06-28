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
 * identically (lazy initial read, then subscribe).
 */
export function makeHydratedHook(store: PersistedStore): () => boolean {
    return function useHydrated(): boolean {
        const [hydrated, setHydrated] = useState(() => store.persist.hasHydrated());

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
