'use client';

import type { Artisan, ArtisanTier, UserRole } from '@lumiris/types';
import { ARTISAN_PASSPORT_LIMIT } from '@lumiris/types';
import { useAuthStore } from './auth-store';
import { elideDe } from './french-elision';
import { useAuthArtisanId, useAuthRole, useAuthUserName } from './use-auth';
import { useSubscription } from './use-subscription';

function atelierNameFor(userName: string | null, role: UserRole | null): string {
    if (userName == null) {
        return role === 'repairer' ? 'Mon compte' : 'Mon Atelier';
    }
    return role === 'repairer' ? userName : `Atelier ${elideDe(userName)}`;
}

function buildArtisan(
    id: string,
    userName: string | null,
    role: UserRole | null,
    tier: ArtisanTier,
    passportLimit: number,
): Artisan {
    return {
        id,
        displayName: userName ?? (role === 'repairer' ? 'Mon compte' : 'Mon Atelier'),
        atelierName: atelierNameFor(userName, role),
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

/** Identité neutre servie hors session — jamais affichée derrière le garde du workspace. */
const UNRESOLVED_ARTISAN: Artisan = buildArtisan('', null, null, 'Solo', ARTISAN_PASSPORT_LIMIT.Solo);

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
    const role = useAuthRole();
    // Live plan + quota (real mode only; the hook self-disables without a token).
    const { subscription, quota } = useSubscription();
    const isRealMode = useAuthStore((s) => s.token != null);

    if (!isRealMode) {
        return UNRESOLVED_ARTISAN;
    }

    const tier = artisanTierFromSubscription(subscription?.tier);
    const passportLimit = quota?.unlimited ? Number.POSITIVE_INFINITY : (quota?.limit ?? ARTISAN_PASSPORT_LIMIT[tier]);

    return buildArtisan(id ?? 'me', userName ?? null, role, tier, passportLimit);
}
