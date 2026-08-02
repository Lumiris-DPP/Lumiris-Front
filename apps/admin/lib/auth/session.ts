// Backend RBAC is flat (single ROLE_ADMIN) — this app's curator/lead_curator/billing_ops/dpo
// distinction doesn't exist server-side yet, so every backend "admin" user maps to platform_admin
// until finer-grained roles land on the backend.

import { createClient, isApiError } from '@lumiris/api-client';
import type { AdminUser } from '@lumiris/types';
import { env } from '@/env';

export interface AdminSession {
    user: AdminUser;
    token: string;
    refreshToken: string;
    signedInAt: string;
    expiresAt: string;
}

export type SignInError = 'invalid_credentials' | 'unknown_email' | 'not_admin';

type SignInResult = { ok: true; session: AdminSession } | { ok: false; error: SignInError };

const STORAGE_KEY = 'lumiris.admin.session';
const SESSION_MS_DEFAULT = 24 * 60 * 60 * 1000;
const SESSION_MS_REMEMBER = 7 * 24 * 60 * 60 * 1000;

type Listener = (session: AdminSession | null) => void;
const listeners = new Set<Listener>();

function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

export function getSessionToken(): string | undefined {
    return readSession()?.token;
}

export function getSessionRefreshToken(): string | undefined {
    return readSession()?.refreshToken;
}

export function updateSessionTokens(token: string, refreshToken: string): void {
    const current = readSession();
    if (current) writeSession({ ...current, token, refreshToken });
}

const client = createClient({
    baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    getToken: getSessionToken,
    getRefreshToken: getSessionRefreshToken,
    onTokensRefreshed: ({ token, refreshToken }) => updateSessionTokens(token, refreshToken),
});

function parseSession(raw: string | null): AdminSession | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as AdminSession;
        if (!parsed?.user?.id || !parsed.token || !parsed.refreshToken || !parsed.expiresAt) return null;
        if (new Date(parsed.expiresAt).getTime() <= Date.now()) return null;
        return parsed;
    } catch {
        return null;
    }
}

function readSession(): AdminSession | null {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const session = parseSession(raw);
    if (!session && raw) {
        window.localStorage.removeItem(STORAGE_KEY);
    }
    return session;
}

function writeSession(session: AdminSession | null): void {
    if (!isBrowser()) return;
    if (session) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
        window.localStorage.removeItem(STORAGE_KEY);
    }
    for (const listener of listeners) listener(session);
}

function toAdminUser(user: Awaited<ReturnType<typeof client.auth.login>>['user']): AdminUser {
    return {
        id: user.id,
        email: user.email ?? '',
        fullName: user.name ?? '',
        role: 'platform_admin',
        ...(user.avatar ? { avatarUrl: user.avatar } : {}),
        createdAt: user.createdAt,
        ...(user.lastSeenAt ? { lastSeenAt: user.lastSeenAt } : {}),
    };
}

async function signIn(email: string, password: string, rememberMe: boolean): Promise<SignInResult> {
    let auth: Awaited<ReturnType<typeof client.auth.login>>;
    try {
        auth = await client.auth.login({ email, password });
    } catch (err) {
        if (isApiError(err) && (err.code === 'AUTH_ERROR' || err.code === 'NOT_FOUND')) {
            return { ok: false, error: 'invalid_credentials' };
        }
        return { ok: false, error: 'unknown_email' };
    }

    if (auth.user.role !== 'admin') {
        return { ok: false, error: 'not_admin' };
    }

    const now = new Date();
    const expires = new Date(now.getTime() + (rememberMe ? SESSION_MS_REMEMBER : SESSION_MS_DEFAULT));
    const session: AdminSession = {
        user: toAdminUser(auth.user),
        token: auth.token,
        refreshToken: auth.refreshToken,
        signedInAt: now.toISOString(),
        expiresAt: expires.toISOString(),
    };
    writeSession(session);
    return { ok: true, session };
}

function signOut(): Promise<void> {
    writeSession(null);
    return Promise.resolve();
}

function getSession(): AdminSession | null {
    return readSession();
}

function subscribe(listener: Listener): () => void {
    listeners.add(listener);

    const onStorage = (event: StorageEvent) => {
        if (event.key !== STORAGE_KEY) return;
        listener(parseSession(event.newValue));
    };
    if (isBrowser()) {
        window.addEventListener('storage', onStorage);
    }

    return () => {
        listeners.delete(listener);
        if (isBrowser()) window.removeEventListener('storage', onStorage);
    };
}

export const auth = {
    signIn,
    signOut,
    getSession,
    subscribe,
};
