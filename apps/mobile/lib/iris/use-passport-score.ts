'use client';

// Mode Tauri : score sync immédiat puis refresh post-IPC (identique → pas de flicker).

import { useEffect, useMemo, useState } from 'react';
import type { Passport, ScoreResult } from '@lumiris/types';
import { scorePassport } from '../passport-score';
import { isTauri, scoreViaBridge } from '../tauri';

export function usePassportScore(passport: Passport, now: Date): ScoreResult;
export function usePassportScore(passport: Passport | null, now: Date): ScoreResult | null;
export function usePassportScore(passport: Passport | null, now: Date): ScoreResult | null {
    const syncScore = useMemo(() => (passport ? scorePassport(passport, now) : null), [passport, now]);
    const [bridgeScore, setBridgeScore] = useState<ScoreResult | null>(null);

    useEffect(() => {
        if (!passport || !isTauri()) {
            setBridgeScore(null);
            return;
        }
        let cancelled = false;
        void scoreViaBridge(passport, now).then((result) => {
            if (!cancelled) setBridgeScore(result);
        });
        return () => {
            cancelled = true;
        };
    }, [passport, now]);

    return bridgeScore ?? syncScore;
}
