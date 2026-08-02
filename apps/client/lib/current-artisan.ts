'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockArtisanById } from '@lumiris/mock-data';
import type { Artisan, ArtisanTier } from '@lumiris/types';
import { ARTISAN_PASSPORT_LIMIT } from '@lumiris/types';
import { signOut, useAuthStore } from './auth-store';
import { useAuthArtisanId, useAuthUserName } from './use-auth';
import { useSubscription } from './use-subscription';

const FALLBACK_ID = 'art-marie';

const FALLBACK_RAW = mockArtisanById(FALLBACK_ID);
if (!FALLBACK_RAW) {
    throw new Error('Mock data missing persona art-marie - atelier dev expects Marie Le Goff.');
}
const FALLBACK: Artisan = FALLBACK_RAW;

/** Normalises the backend subscription tier string onto the local ArtisanTier. */
function artisanTierFromSubscription(tier: string | null | undefined): ArtisanTier {
    switch ((tier ?? '').toLowerCase()) {
        case 'studio':
            return 'Studio';
        case 'maison':
            return 'Maison';
        default:
            return 'Solo';
    }
}

export function useCurrentArtisan(): Artisan {
    const id = useAuthArtisanId();
    const userName = useAuthUserName();
    const router = useRouter();
    // Live plan + quota (real mode only; the hook self-disables without a token).
    const { subscription, quota } = useSubscription();

    const mockArtisan = id != null ? (mockArtisanById(id) ?? null) : null;
    const isRealMode = useAuthStore((s) => s.token != null);

    useEffect(() => {
        // In demo mode, if the stored ID doesn't match any mock artisan, sign out
        if (id != null && mockArtisan === null && !isRealMode) {
            console.warn(`[atelier] Artisan id "${id}" introuvable dans mockArtisans. Sign-out automatique.`);
            signOut();
            router.replace('/login');
        }
    }, [id, mockArtisan, isRealMode, router]);

    // Demo mode: use mock data
    if (mockArtisan !== null) return mockArtisan;

    // Real mode: construct a minimal Artisan from stored identity, with tier + quota
    // driven by the live subscription (GET /api/subscription) — never hardcoded.
    if (id != null && isRealMode) {
        const tier = artisanTierFromSubscription(subscription?.tier);
        const passportLimit = quota?.unlimited
            ? Number.POSITIVE_INFINITY
            : (quota?.limit ?? ARTISAN_PASSPORT_LIMIT[tier]);
        return {
            id,
            displayName: userName ?? 'Mon Atelier',
            atelierName: userName ? `Atelier de ${userName}` : 'Mon Atelier',
            city: '',
            region: 'Île-de-France',
            tier,
            plus: false,
            epvLabeled: false,
            ofgLabeled: false,
            specialities: [],
            story: '',
            photoUrl: '',
            joinedAt: new Date().toISOString(),
            passportLimit,
        };
    }

    return FALLBACK;
}
