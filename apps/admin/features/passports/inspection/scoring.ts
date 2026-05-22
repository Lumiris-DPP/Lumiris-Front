import { computeScore } from '@lumiris/core/scoring';
import { mockArtisans, mockRepairers } from '@lumiris/mock-data';
import type { Passport, ScoreResult } from '@lumiris/types';
import { SCORING_NOW } from './types';

export function scorePassport(passport: Passport): ScoreResult {
    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
    return computeScore(passport, {
        certificates: passport.materials.flatMap((m) => m.certifications),
        ...(artisan ? { artisan } : {}),
        retoucheurs: mockRepairers,
        now: SCORING_NOW,
    });
}
