'use client';

import { useSyncExternalStore } from 'react';
import { readUser } from '../auth/storage';
import { USER_KEYS, userScopedKey } from '../storage-keys';

const EVENT = 'lumiris:compare-changed';
const USER_CHANGED = 'lumiris:user-changed';
const MAX = 2;

const subscribers = new Set<() => void>();

function currentKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.compare);
}

function read(): readonly string[] {
    if (typeof window === 'undefined') return EMPTY;
    try {
        const raw = window.localStorage.getItem(currentKey());
        if (!raw) return EMPTY;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return EMPTY;
        const ids = parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX);
        return ids.length === 0 ? EMPTY : ids;
    } catch {
        return EMPTY;
    }
}

function write(ids: readonly string[]): void {
    if (typeof window === 'undefined') return;
    const key = currentKey();
    if (ids.length === 0) {
        window.localStorage.removeItem(key);
    } else {
        window.localStorage.setItem(key, JSON.stringify(ids));
    }
    notify();
}

function notify(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(EVENT));
    subscribers.forEach((cb) => cb());
}

const EMPTY: readonly string[] = [];

export function toggleCompare(passportId: string): void {
    const current = read();
    if (current.includes(passportId)) {
        write(current.filter((id) => id !== passportId));
        return;
    }
    if (current.length >= MAX) return;
    write([...current, passportId]);
}

export function setCompare(ids: readonly string[]): void {
    write(ids.slice(0, MAX));
}

export function clearCompare(): void {
    if (read().length === 0) return;
    write(EMPTY);
}

let snapshot: readonly string[] = EMPTY;
let snapshotSerialized = '';

function getSnapshot(): readonly string[] {
    const current = read();
    const serialized = JSON.stringify(current);
    if (serialized !== snapshotSerialized) {
        snapshot = current;
        snapshotSerialized = serialized;
    }
    return snapshot;
}

function getServerSnapshot(): readonly string[] {
    return EMPTY;
}

function subscribe(cb: () => void): () => void {
    subscribers.add(cb);
    if (typeof window !== 'undefined') {
        window.addEventListener(EVENT, cb);
        window.addEventListener('storage', cb);
        window.addEventListener(USER_CHANGED, cb);
    }
    return () => {
        subscribers.delete(cb);
        if (typeof window !== 'undefined') {
            window.removeEventListener(EVENT, cb);
            window.removeEventListener('storage', cb);
            window.removeEventListener(USER_CHANGED, cb);
        }
    };
}

export function useCompare(): readonly string[] {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const COMPARE_MAX = MAX;
