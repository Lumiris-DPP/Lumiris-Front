'use client';

// SSOT scoring = @lumiris/core ; en Tauri on passe par l'IPC Rust `compute_score` qui valide le JSON.

import type { Passport, ScoreResult } from '@lumiris/types';
import { scorePassport } from './passport-score';

declare global {
    interface Window {
        __TAURI__?: unknown;
        __TAURI_INTERNALS__?: unknown;
    }
}

export function isTauri(): boolean {
    if (typeof window === 'undefined') return false;
    return window.__TAURI__ !== undefined || window.__TAURI_INTERNALS__ !== undefined;
}

export async function scoreViaBridge(passport: Passport, now: Date): Promise<ScoreResult> {
    if (!isTauri()) return scorePassport(passport, now);
    // Import dynamique : `@tauri-apps/api/core` n'est jamais évalué dans le bundle web.
    const { invoke } = await import('@tauri-apps/api/core');
    const dppJson = JSON.stringify(passport);
    const validated = await invoke<Passport>('compute_score', { dppJson });
    return scorePassport(validated, now);
}
