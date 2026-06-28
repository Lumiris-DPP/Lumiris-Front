'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJSONStorage } from './persist-storage';
import { mockArtisanById } from '@lumiris/mock-data';
import type { Artisan, FrenchRegion } from '@lumiris/types';

interface ProfileOverride {
    story?: string;
    city?: string;
    region?: FrenchRegion;
    specialities?: string[];
    photoUrl?: string;
    epvLabeled?: boolean;
    ofgLabeled?: boolean;
}

export interface ProfileSnapshot {
    story: string;
    city: string;
    region: FrenchRegion;
    specialities: string[];
    photoUrl: string;
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

function baselineFromArtisan(artisan: Artisan): ProfileSnapshot {
    return {
        story: artisan.story,
        city: artisan.city,
        region: artisan.region,
        specialities: [...artisan.specialities],
        photoUrl: artisan.photoUrl,
        epvLabeled: artisan.epvLabeled,
        ofgLabeled: artisan.ofgLabeled,
    };
}

function fallbackProfile(): ProfileSnapshot {
    return {
        story: '',
        city: '',
        region: 'Île-de-France',
        specialities: [],
        photoUrl: '',
        epvLabeled: false,
        ofgLabeled: false,
    };
}

function applyOverride(base: ProfileSnapshot, override: ProfileOverride | undefined): ProfileSnapshot {
    if (!override) return base;
    return {
        story: override.story ?? base.story,
        city: override.city ?? base.city,
        region: override.region ?? base.region,
        specialities: override.specialities ?? base.specialities,
        photoUrl: override.photoUrl ?? base.photoUrl,
        epvLabeled: override.epvLabeled ?? base.epvLabeled,
        ofgLabeled: override.ofgLabeled ?? base.ofgLabeled,
    };
}

export function useProfile(artisanId: string): ProfileSnapshot {
    const override = useProfileStore((s) => s.byArtisan[artisanId]);
    const artisan = mockArtisanById(artisanId);
    if (!artisan) return fallbackProfile();
    return applyOverride(baselineFromArtisan(artisan), override);
}
