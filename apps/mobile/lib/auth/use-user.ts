'use client';

import { useSyncExternalStore } from 'react';
import type { User } from '@lumiris/types';
import { readUser, writeUser } from './storage';
import type { AuthUser } from './types';

const EVENT = 'lumiris:auth-changed';
// Distinct d'`auth-changed` : signale aux hooks per-user que le scope localStorage a changé.
const USER_CHANGED_EVENT = 'lumiris:user-changed';
const subscribers = new Set<() => void>();

function notify(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(EVENT));
    window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT));
    subscribers.forEach((cb) => cb());
}

let snapshot: AuthUser | null = null;
let snapshotSerialized = '';

function getSnapshot(): AuthUser | null {
    const current = readUser();
    const serialized = current ? JSON.stringify(current) : '';
    if (serialized !== snapshotSerialized) {
        snapshot = current;
        snapshotSerialized = serialized;
    }
    return snapshot;
}

function getServerSnapshot(): AuthUser | null {
    return null;
}

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

export function useUser(): UseUserResult {
    const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return {
        user,
        isAuthenticated: user !== null,
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
        updateUser(patch) {
            const current = readUser();
            if (!current) return;
            writeUser({ ...current, ...patch });
            notify();
        },
    };
}
