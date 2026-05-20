'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from './auth-store';

export function useAuthArtisanId(): string | null {
    return useAuthStore((s) => s.artisanId);
}

export function useAuthHydrated(): boolean {
    const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

    useEffect(() => {
        if (useAuthStore.persist.hasHydrated()) {
            setHydrated(true);
            return;
        }
        const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
        return unsub;
    }, []);

    return hydrated;
}
