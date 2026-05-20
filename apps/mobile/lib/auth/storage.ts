import { DEVICE_KEYS } from '../storage-keys';
import type { MockUser } from './types';

const KEY = DEVICE_KEYS.authUser;

function isMockUser(value: unknown): value is MockUser {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' &&
        typeof v.email === 'string' &&
        typeof v.displayName === 'string' &&
        typeof v.createdAt === 'string'
    );
}

export function readUser(): MockUser | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isMockUser(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function writeUser(user: MockUser | null): void {
    if (typeof window === 'undefined') return;
    if (user === null) {
        window.localStorage.removeItem(KEY);
    } else {
        window.localStorage.setItem(KEY, JSON.stringify(user));
    }
}
