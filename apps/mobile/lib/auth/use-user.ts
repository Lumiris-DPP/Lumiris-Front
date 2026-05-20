'use client';

import { useSyncExternalStore } from 'react';
import { readUser, writeUser } from './storage';
import type { MockUser } from './types';

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

let snapshot: MockUser | null = null;
let snapshotSerialized = '';

function getSnapshot(): MockUser | null {
    const current = readUser();
    const serialized = current ? JSON.stringify(current) : '';
    if (serialized !== snapshotSerialized) {
        snapshot = current;
        snapshotSerialized = serialized;
    }
    return snapshot;
}

function getServerSnapshot(): MockUser | null {
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

function makeId(email: string): string {
    const base = email.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `vision-${base}-${Date.now().toString(36)}`;
}

interface UseUserResult {
    user: MockUser | null;
    isAuthenticated: boolean;
    signIn: (email: string, displayName: string) => MockUser;
    signOut: () => void;
    updateUser: (patch: Partial<Omit<MockUser, 'id' | 'email' | 'createdAt'>>) => void;
}

export function useUser(): UseUserResult {
    const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return {
        user,
        isAuthenticated: user !== null,
        signIn(email, displayName) {
            const next: MockUser = {
                id: makeId(email),
                email,
                displayName,
                createdAt: new Date().toISOString(),
            };
            writeUser(next);
            notify();
            return next;
        },
        signOut() {
            writeUser(null);
            notify();
        },
        updateUser(patch) {
            const current = readUser();
            if (!current) return;
            writeUser({ ...current, ...patch });
            notify();
        },
    };
}
