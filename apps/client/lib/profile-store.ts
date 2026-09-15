'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJSONStorage } from './persist-storage';

interface ProfileOverride {
    epvLabeled?: boolean;
    ofgLabeled?: boolean;
}

interface ProfileSnapshot {
    epvLabeled: boolean;
    ofgLabeled: boolean;
}

interface ProfileStoreState {
    byArtisan: Record<string, ProfileOverride>;
    setOverride: (artisanId: string, patch: ProfileOverride) => void;
    resetOverride: (artisanId: string) => void;
}

export const useProfileStore = create<ProfileStoreState>()(
    persist(
        (set) => ({
            byArtisan: {},
            setOverride: (artisanId, patch) =>
                set((s) => ({
                    byArtisan: {
                        ...s.byArtisan,
                        [artisanId]: { ...s.byArtisan[artisanId], ...patch },
                    },
                })),
            resetOverride: (artisanId) =>
                set((s) => {
                    const next = { ...s.byArtisan };
                    delete next[artisanId];
                    return { byArtisan: next };
                }),
        }),
        {
            name: 'atelier-profile',
            version: 1,
            storage: safeJSONStorage,
        },
    ),
);

const UNLABELLED: ProfileSnapshot = {
    epvLabeled: false,
    ofgLabeled: false,
};

function applyOverride(base: ProfileSnapshot, override: ProfileOverride | undefined): ProfileSnapshot {
    if (!override) return base;
    return {
        epvLabeled: override.epvLabeled ?? base.epvLabeled,
        ofgLabeled: override.ofgLabeled ?? base.ofgLabeled,
    };
}

export function useProfile(artisanId: string): ProfileSnapshot {
    const override = useProfileStore((s) => s.byArtisan[artisanId]);
    return applyOverride(UNLABELLED, override);
}
