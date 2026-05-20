// N'efface que le scope user courant + scope `anon`. Préserve `DEVICE_KEYS` et les autres personas.

import { ANON_SCOPE_PREFIX, userScopePrefix } from '../storage-keys';
import { readUser } from './storage';

const CHANGE_EVENTS = [
    'lumiris:wardrobe-changed',
    'lumiris:scan-counter-changed',
    'lumiris:auth-changed',
    'lumiris:compare-changed',
    'lumiris:repairs-changed',
    'lumiris:settings-changed',
    'lumiris:user-changed',
] as const;

export function wipeAllUserData(): void {
    if (typeof window === 'undefined') return;

    const userId = readUser()?.id ?? null;
    const userPrefix = userId ? userScopePrefix(userId) : null;

    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key === null) continue;
        if (key.startsWith(ANON_SCOPE_PREFIX)) {
            keysToRemove.push(key);
            continue;
        }
        if (userPrefix !== null && key.startsWith(userPrefix)) {
            keysToRemove.push(key);
        }
    }
    for (const key of keysToRemove) {
        window.localStorage.removeItem(key);
    }

    for (const event of CHANGE_EVENTS) {
        window.dispatchEvent(new CustomEvent(event));
    }
}
