'use client';

// Façade Tauri ↔ JS pour le scoring DPP. Au runtime :
//   1. `isTauri()` détecte le shell natif (window.__TAURI__ / __TAURI_INTERNALS__)
//   2. en Tauri → on sérialise le passeport, on traverse l'IPC vers la commande Rust
//      `compute_score` (qui valide le JSON), puis on repasse le DPP validé à `scorePassport`
//   3. en pur web → on court-circuite l'IPC et on appelle `scorePassport` directement
// L'algo 40/25/25/10 reste SSOT côté `@lumiris/core` ; Rust n'est qu'un point d'entrée
// natif (futur : télémétrie, cache, persistance offline) — pas une réimplémentation.

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
