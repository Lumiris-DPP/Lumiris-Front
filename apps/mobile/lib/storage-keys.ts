const STORAGE_PREFIX = 'lumiris.';

/** Device-globales, indépendantes du user connecté. */
export const DEVICE_KEYS = {
    authUser: 'lumiris.auth.user.v1',
    onboardingCompleted: 'lumiris.onboarding.completed.v1',
    cameraPromptSeen: 'lumiris.camera.prompt-seen.v1',
    geolocPromptSeen: 'lumiris.geoloc.prompt-seen.v1',
    deviceKey: 'lumiris.devicekey.v1',
} as const;

/** Suffixes à combiner avec `userScopedKey(userId, suffix)` — jamais utilisés bruts. */
export const USER_KEYS = {
    wardrobe: 'wardrobe.v2',
    scanCounter: 'scans.v1',
    compare: 'compare.v1',
    settings: 'settings.v1',
    affiliateClicks: 'affiliate.clicks.v1',
    repairs: 'repairs.v1',
    cart: 'cart.v1',
    shippingAddress: 'shipping-address.v1',
    orders: 'orders.v1',
} as const;

/** `lumiris.users.{userId}.{suffix}` ou `lumiris.anon.{suffix}` (tampon avant signIn). */
export function userScopedKey(userId: string | null, suffix: string): string {
    const namespace = userId ? `users.${userId}` : 'anon';
    return `${STORAGE_PREFIX}${namespace}.${suffix}`;
}

export function userScopePrefix(userId: string): string {
    return `${STORAGE_PREFIX}users.${userId}.`;
}

export const ANON_SCOPE_PREFIX = `${STORAGE_PREFIX}anon.`;
