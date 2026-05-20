import { computeScore, type ComputeScoreOptions } from '@lumiris/core/scoring';
import { mockArtisanById, mockRepairersByCity, mockCertificates } from '@lumiris/mock-data';
import type { Passport, ScoreResult } from '@lumiris/types';

export function scorePassport(passport: Passport, now: Date): ScoreResult {
    const artisan = mockArtisanById(passport.artisanId);
    const retoucheurs = artisan ? mockRepairersByCity(artisan.city) : [];
    const options: ComputeScoreOptions = {
        certificates: mockCertificates,
        retoucheurs,
        artisan,
        now,
    };
    return computeScore(passport, options);
}
