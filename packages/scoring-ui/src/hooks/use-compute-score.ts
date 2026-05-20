'use client';

import { useMemo } from 'react';
import { computeScore, type ComputeScoreOptions } from '@lumiris/core/scoring';
import type { Passport, ScoreResult } from '@lumiris/types';

export function useComputeScore(passport: Passport, options: ComputeScoreOptions): ScoreResult {
    return useMemo(() => computeScore(passport, options), [passport, options]);
}
