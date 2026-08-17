import { computeScore } from '@lumiris/core/scoring';
import { mockArtisans, mockRepairers } from '@lumiris/mock-data';
import type { Passport, ScoreResult } from '@lumiris/types';
import { FIXTURE_NOW } from '@/lib/fixture-clock';

export function scorePassport(passport: Passport): ScoreResult {
    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
    return computeScore(passport, {
        certificates: passport.materials.flatMap((m) => m.certifications),
        ...(artisan ? { artisan } : {}),
        retoucheurs: mockRepairers,
        now: FIXTURE_NOW,
    });
}
