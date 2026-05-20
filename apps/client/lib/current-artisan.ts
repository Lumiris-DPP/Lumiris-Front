'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockArtisanById } from '@lumiris/mock-data';
import type { Artisan } from '@lumiris/types';
import { signOut } from './auth-store';
import { useAuthArtisanId } from './use-auth';

const FALLBACK_ID = 'art-marie';

const FALLBACK_RAW = mockArtisanById(FALLBACK_ID);
if (!FALLBACK_RAW) {
    throw new Error('Mock data missing persona art-marie - atelier dev expects Marie Le Goff.');
}
const FALLBACK: Artisan = FALLBACK_RAW;

export function useCurrentArtisan(): Artisan {
    const id = useAuthArtisanId();
    const router = useRouter();
    const resolved = id == null ? FALLBACK : (mockArtisanById(id) ?? null);

    useEffect(() => {
        if (id != null && resolved === null) {
            console.warn(
                `[atelier] Artisan id "${id}" introuvable dans mockArtisans. ` +
                    `Sign-out automatique pour éviter une démo incohérente.`,
            );
            signOut();
            router.replace('/login');
        }
    }, [id, resolved, router]);

    return resolved ?? FALLBACK;
}
