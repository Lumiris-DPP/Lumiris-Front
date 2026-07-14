import { DEVICE_KEYS } from '../storage-keys';
import type { AuthUser } from './types';

const KEY = DEVICE_KEYS.authUser;

function isAuthUser(value: unknown): value is AuthUser {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' &&
        typeof v.email === 'string' &&
        typeof v.displayName === 'string' &&
        typeof v.token === 'string' &&
        typeof v.refreshToken === 'string' &&
        typeof v.createdAt === 'string'
    );
}

export function readUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isAuthUser(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function writeUser(user: AuthUser | null): void {
    if (typeof window === 'undefined') return;
    if (user === null) {
        window.localStorage.removeItem(KEY);
    } else {
        window.localStorage.setItem(KEY, JSON.stringify(user));
    }
}

// Read directly by the api-client's http layer (outside React) for auto token-refresh.
export function readToken(): string | undefined {
    return readUser()?.token;
}

export function readRefreshToken(): string | undefined {
    return readUser()?.refreshToken;
}

export function updateTokens(token: string, refreshToken: string): void {
    const current = readUser();
    if (!current) return;
    writeUser({ ...current, token, refreshToken });
}
