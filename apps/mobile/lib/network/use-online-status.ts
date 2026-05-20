'use client';

import { useSyncExternalStore } from 'react';

// SSR : retourne `true` pour éviter le mismatch d'hydratation Next 16 (pas de `navigator`).
function getSnapshot(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
}

function getServerSnapshot(): boolean {
    return true;
}

function subscribe(notify: () => void): () => void {
    if (typeof window === 'undefined') return () => undefined;
    window.addEventListener('online', notify);
    window.addEventListener('offline', notify);
    return () => {
        window.removeEventListener('online', notify);
        window.removeEventListener('offline', notify);
    };
}

export function useOnlineStatus(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
