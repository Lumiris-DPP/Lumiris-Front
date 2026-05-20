'use client';

// Migration idempotente des buckets localStorage non-scopés vers `lumiris.users.{userId}.<suffix>`.

import { readUser } from './auth/storage';
import { USER_KEYS, userScopedKey } from './storage-keys';

interface LegacyMapping {
    legacyKey: string;
    suffix: (typeof USER_KEYS)[keyof typeof USER_KEYS];
}

const LEGACY_MAPPINGS: readonly LegacyMapping[] = [
    { legacyKey: 'lumiris.wardrobe.v1', suffix: USER_KEYS.wardrobe },
    { legacyKey: 'lumiris.scans.v1', suffix: USER_KEYS.scanCounter },
    { legacyKey: 'lumiris.compare.v1', suffix: USER_KEYS.compare },
    { legacyKey: 'lumiris.settings.v1', suffix: USER_KEYS.settings },
    { legacyKey: 'lumiris.affiliate.clicks.v1', suffix: USER_KEYS.affiliateClicks },
    { legacyKey: 'lumiris.repairs.v1', suffix: USER_KEYS.repairs },
];

export function migrateLegacyKeys(): void {
    if (typeof window === 'undefined') return;

    const userId = readUser()?.id ?? null;

    for (const { legacyKey, suffix } of LEGACY_MAPPINGS) {
        const legacyValue = window.localStorage.getItem(legacyKey);
        if (legacyValue === null) continue;

        const targetKey = userScopedKey(userId, suffix);
        const alreadyHasTarget = window.localStorage.getItem(targetKey) !== null;

        if (!alreadyHasTarget) {
            window.localStorage.setItem(targetKey, legacyValue);
        }
        window.localStorage.removeItem(legacyKey);
    }
}
