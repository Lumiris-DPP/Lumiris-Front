'use client';

import { useSyncExternalStore } from 'react';
import { readUser } from './auth/storage';
import { USER_KEYS, userScopedKey } from './storage-keys';

export type ThemePref = 'system' | 'light' | 'dark';

export interface Settings {
    theme: ThemePref;
    reduceMotion: boolean;
}

const DEFAULT_SETTINGS: Settings = {
    theme: 'system',
    reduceMotion: false,
};

const EVENT = 'lumiris:settings-changed';
const USER_CHANGED = 'lumiris:user-changed';

const subscribers = new Set<() => void>();

function currentKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.settings);
}

function notify(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(EVENT));
    subscribers.forEach((cb) => cb());
}

const VALID_THEMES: readonly ThemePref[] = ['system', 'light', 'dark'];

function isThemePref(value: unknown): value is ThemePref {
    return typeof value === 'string' && (VALID_THEMES as readonly string[]).includes(value);
}

function pickSettings(value: unknown): Partial<Settings> {
    if (!value || typeof value !== 'object') return {};
    const v = value as Record<string, unknown>;
    const out: Partial<Settings> = {};
    if (isThemePref(v.theme)) out.theme = v.theme;
    if (typeof v.reduceMotion === 'boolean') out.reduceMotion = v.reduceMotion;
    return out;
}

function read(): Settings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
        const raw = window.localStorage.getItem(currentKey());
        if (!raw) return DEFAULT_SETTINGS;
        const parsed: unknown = JSON.parse(raw);
        return { ...DEFAULT_SETTINGS, ...pickSettings(parsed) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

function write(settings: Settings): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(currentKey(), JSON.stringify(settings));
    notify();
}

export function updateSettings(patch: Partial<Settings>): void {
    write({ ...read(), ...patch });
}

let snapshotCache: Settings = DEFAULT_SETTINGS;
let snapshotSerialized = '';

function getSnapshot(): Settings {
    const current = read();
    const serialized = JSON.stringify(current);
    if (serialized !== snapshotSerialized) {
        snapshotCache = current;
        snapshotSerialized = serialized;
    }
    return snapshotCache;
}

function getServerSnapshot(): Settings {
    return DEFAULT_SETTINGS;
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

export function useSettings(): Settings {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
