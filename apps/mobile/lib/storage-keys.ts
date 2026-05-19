const STORAGE_PREFIX = 'lumiris.';

/** Clés device-globales : ne dépendent pas du user connecté. */
export const DEVICE_KEYS = {
    authUser: 'lumiris.auth.user.v1',
    onboardingCompleted: 'lumiris.onboarding.completed.v1',
    cameraPromptSeen: 'lumiris.camera.prompt-seen.v1',
    geolocPromptSeen: 'lumiris.geoloc.prompt-seen.v1',
    deviceKey: 'lumiris.devicekey.v1',
} as const;

/**
 * Suffixes des clés user-personnelles. À combiner avec `userScopedKey(userId, suffix)`
 * - jamais à utiliser tel quel dans `localStorage`.
 */
export const USER_KEYS = {
    wardrobe: 'wardrobe.v2',
    scanCounter: 'scans.v1',
    compare: 'compare.v1',
    settings: 'settings.v1',
    affiliateClicks: 'affiliate.clicks.v1',
    repairs: 'repairs.v1',
} as const;

/**
 * Construit la clé localStorage pour une donnée user-personnelle.
 * - User connecté → `lumiris.users.{userId}.{suffix}`
 * - Anonyme       → `lumiris.anon.{suffix}` (consigne tampon avant signIn)
 */
export function userScopedKey(userId: string | null, suffix: string): string {
    const namespace = userId ? `users.${userId}` : 'anon';
    return `${STORAGE_PREFIX}${namespace}.${suffix}`;
}

/** Préfixe d'un user donné, utile pour le wipe ciblé. */
export function userScopePrefix(userId: string): string {
    return `${STORAGE_PREFIX}users.${userId}.`;
}

export const ANON_SCOPE_PREFIX = `${STORAGE_PREFIX}anon.`;
