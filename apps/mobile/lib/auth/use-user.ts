'use client';

import { useSyncExternalStore } from 'react';
import type { User } from '@lumiris/types';
import { readUser, writeUser } from './storage';
import type { AuthUser } from './types';

const EVENT = 'lumiris:auth-changed';
// Distinct d'`auth-changed` : signale aux hooks per-user que le scope localStorage a changé.
const USER_CHANGED_EVENT = 'lumiris:user-changed';
const subscribers = new Set<() => void>();

/** Informe les lecteurs locaux du changement de stockage. */
function notify(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(EVENT));
    window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT));
    subscribers.forEach((cb) => cb());
}

let snapshot: AuthUser | null = null;
let snapshotSerialized = '';

/** Conserve un instantané stable tant que le stockage ne change pas. */
function getSnapshot(): AuthUser | null {
    const current = readUser();
    const serialized = current ? JSON.stringify(current) : '';
    if (serialized !== snapshotSerialized) {
        snapshot = current;
        snapshotSerialized = serialized;
    }
    return snapshot;
}

/** Fournit l’état initial sans stockage navigateur. */
function getServerSnapshot(): AuthUser | null {
    return null;
}

/** Abonne les lecteurs aux changements du stockage local et du compte. */
function subscribe(cb: () => void): () => void {
    subscribers.add(cb);
    if (typeof window !== 'undefined') {
        window.addEventListener(EVENT, cb);
        window.addEventListener('storage', cb);
    }
    return () => {
        subscribers.delete(cb);
        if (typeof window !== 'undefined') {
            window.removeEventListener(EVENT, cb);
            window.removeEventListener('storage', cb);
        }
    };
}

// Called by the api-client's http layer (outside React) after a 401 it can't recover from.
export function clearUser(): void {
    writeUser(null);
    notify();
}

interface UseUserResult {
    user: AuthUser | null;
    isAuthenticated: boolean;
    signIn: (result: User, token: string, refreshToken: string) => void;
    signOut: () => void;
    updateUser: (patch: Partial<Omit<AuthUser, 'id' | 'email' | 'createdAt' | 'token' | 'refreshToken'>>) => void;
}

/** Expose la session locale et ses opérations de connexion. */
export function useUser(): UseUserResult {
    const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return {
        user,
        isAuthenticated: user !== null,
        /** Enregistre le compte authentifié avant de notifier ses lecteurs. */
        signIn(result, token, refreshToken) {
            const existing = readUser();
            const sameAccount = existing?.id === result.id;
            const next: AuthUser = {
                id: result.id,
                email: result.email ?? '',
                displayName: result.name ?? result.email ?? '',
                token,
                refreshToken,
                city: sameAccount ? existing.city : undefined,
                stylePrefs: sameAccount ? existing.stylePrefs : undefined,
                createdAt: sameAccount ? existing.createdAt : new Date().toISOString(),
            };
            writeUser(next);
            notify();
        },
        signOut: clearUser,
        /** Met à jour les préférences du compte courant. */
        updateUser(patch) {
            const current = readUser();
            if (!current) return;
            writeUser({ ...current, ...patch });
            notify();
        },
    };
}
