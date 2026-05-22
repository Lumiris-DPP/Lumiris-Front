// Mock auth — toute l'API est conçue pour être stable au swap backend.
// Quand le backend Spring sera prêt, seul ce fichier change : `signIn` → POST /admin/auth/login,
// `signOut` → POST /admin/auth/logout, `getSession` → GET /admin/auth/me, `subscribe` → SSE/polling.
// Le reste de l'app (composants, hooks, gardes de route) reste inchangé.
//
// Le stockage `localStorage` est volontaire pour le mock — à remplacer par un cookie httpOnly
// géré côté backend dès que l'auth réelle arrivera.

import type { AdminUser } from '@lumiris/types';
import { mockAdminUsers } from '@lumiris/mock-data';

export interface AdminSession {
    user: AdminUser;
    signedInAt: string;
    expiresAt: string;
}

export type SignInError = 'invalid_credentials' | 'unknown_email';

export type SignInResult = { ok: true; session: AdminSession } | { ok: false; error: SignInError };

const STORAGE_KEY = 'lumiris.admin.session';
const SESSION_MS_DEFAULT = 24 * 60 * 60 * 1000;
const SESSION_MS_REMEMBER = 7 * 24 * 60 * 60 * 1000;
const MOCK_LATENCY_MS = 400;

type Listener = (session: AdminSession | null) => void;
const listeners = new Set<Listener>();

function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

function parseSession(raw: string | null): AdminSession | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as AdminSession;
        if (!parsed?.user?.id || !parsed.expiresAt) return null;
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

function buildSession(user: AdminUser, rememberMe: boolean): AdminSession {
    const now = new Date();
    const expires = new Date(now.getTime() + (rememberMe ? SESSION_MS_REMEMBER : SESSION_MS_DEFAULT));
    return {
        user,
        signedInAt: now.toISOString(),
        expiresAt: expires.toISOString(),
    };
}

async function signIn(email: string, password: string, rememberMe: boolean): Promise<SignInResult> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

    if (!password.trim()) {
        return { ok: false, error: 'invalid_credentials' };
    }

    const normalized = email.trim().toLowerCase();
    const user = mockAdminUsers.find((candidate) => candidate.email.toLowerCase() === normalized);
    if (!user) {
        return { ok: false, error: 'unknown_email' };
    }

    const session = buildSession(user, rememberMe);
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
