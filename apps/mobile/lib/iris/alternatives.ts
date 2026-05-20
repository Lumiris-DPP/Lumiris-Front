// INVARIANT cahier §10 : aucune pondération commerciale ; tri par grade puis prix croissant.

import { mockPassports } from '@lumiris/mock-data';
import type { Passport, ScoreResult } from '@lumiris/types';
import { scorePassport } from '../passport-score';

interface AlternativeMatch {
    passport: Passport;
    score: ScoreResult;
}

export function findAlternatives(source: Passport, now: Date, limit = 6): readonly AlternativeMatch[] {
    return mockPassports
        .filter((p) => p.id !== source.id && p.garment.kind === source.garment.kind && p.status === 'Published')
        .map((p) => ({ passport: p, score: scorePassport(p, now) }))
        .filter((row) => row.score.grade === 'A' || row.score.grade === 'B')
        .sort((a, b) => {
            if (a.score.grade !== b.score.grade) return a.score.grade.localeCompare(b.score.grade);
            return a.passport.garment.retailPrice - b.passport.garment.retailPrice;
        })
        .slice(0, limit);
}
