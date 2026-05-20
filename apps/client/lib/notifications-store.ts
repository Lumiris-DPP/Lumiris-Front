'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationsStoreState {
    dismissedByArtisan: Record<string, string[]>;
    dismiss: (artisanId: string, notificationId: string) => void;
    dismissAll: (artisanId: string, ids: readonly string[]) => void;
    pruneStale: (artisanId: string, liveIds: readonly string[]) => void;
}

const noopStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
};

export const useNotificationsStore = create<NotificationsStoreState>()(
    persist(
        (set, get) => ({
            dismissedByArtisan: {},
            dismiss: (artisanId, id) =>
                set((s) => ({
                    dismissedByArtisan: {
                        ...s.dismissedByArtisan,
                        [artisanId]: Array.from(new Set([...(s.dismissedByArtisan[artisanId] ?? []), id])),
                    },
                })),
            dismissAll: (artisanId, ids) =>
                set((s) => ({
                    dismissedByArtisan: {
                        ...s.dismissedByArtisan,
                        [artisanId]: Array.from(new Set([...(s.dismissedByArtisan[artisanId] ?? []), ...ids])),
                    },
                })),
            pruneStale: (artisanId, liveIds) => {
                const cur = get().dismissedByArtisan[artisanId] ?? [];
                const liveSet = new Set(liveIds);
                const next = cur.filter((id) => liveSet.has(id));
                if (next.length === cur.length) return;
                set((s) => ({
                    dismissedByArtisan: { ...s.dismissedByArtisan, [artisanId]: next },
                }));
            },
        }),
        {
            name: 'atelier-notifications',
            version: 1,
            storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
        },
    ),
);

const EMPTY_DISMISSED: readonly string[] = [];

export function useDismissedNotifications(artisanId: string): readonly string[] {
    return useNotificationsStore((s) => s.dismissedByArtisan[artisanId] ?? EMPTY_DISMISSED);
}
