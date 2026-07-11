import { createJSONStorage } from 'zustand/middleware';

/** No-op storage used during SSR, where `localStorage` is unavailable. */
const noopStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
};

/**
 * Shared storage for persisted Zustand stores: `localStorage` in the browser,
 * a no-op on the server. Use as `storage: safeJSONStorage` in the persist config.
 */
export const safeJSONStorage = createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage));
