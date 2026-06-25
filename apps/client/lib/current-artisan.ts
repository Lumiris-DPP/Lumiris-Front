'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockArtisanById } from '@lumiris/mock-data';
import type { Artisan } from '@lumiris/types';
import { signOut, useAuthStore } from './auth-store';
import { useAuthArtisanId, useAuthUserName } from './use-auth';

const FALLBACK_ID = 'art-marie';

const FALLBACK_RAW = mockArtisanById(FALLBACK_ID);
if (!FALLBACK_RAW) {
    throw new Error('Mock data missing persona art-marie - atelier dev expects Marie Le Goff.');
}
const FALLBACK: Artisan = FALLBACK_RAW;

export function useCurrentArtisan(): Artisan {
    const id = useAuthArtisanId();
    const userName = useAuthUserName();
    const router = useRouter();

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

    // Real mode: construct a minimal Artisan from stored identity
    if (id != null && isRealMode) {
        return {
            id,
            displayName: userName ?? 'Mon Atelier',
            atelierName: userName ? `Atelier de ${userName}` : 'Mon Atelier',
            city: '',
            region: 'Île-de-France',
            tier: 'Solo',
            plus: false,
            epvLabeled: false,
            ofgLabeled: false,
            specialities: [],
            story: '',
            photoUrl: '',
            joinedAt: new Date().toISOString(),
            passportLimit: 50,
        };
    }

    return FALLBACK;
}
