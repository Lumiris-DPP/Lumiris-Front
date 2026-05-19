'use client';

import { readUser } from './auth/storage';
import { USER_KEYS, userScopedKey } from './storage-keys';

function currentKey(): string {
    return userScopedKey(readUser()?.id ?? null, USER_KEYS.scanCounter);
}

function read(): number {
    if (typeof window === 'undefined') return 0;
    const raw = window.localStorage.getItem(currentKey());
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function incrementScanCounter(): void {
    if (typeof window === 'undefined') return;
    const next = read() + 1;
    window.localStorage.setItem(currentKey(), String(next));
}
