// Tri par grade puis prix croissant. AUCUNE pondération ATELIER+, AUCUNE commission.
// Cf. cahier §10 « mise en avant à score équivalent uniquement, indépendant des commissions ».
// Toute modification qui introduit un poids commercial doit faire l'objet d'une revue produit.

import { mockPassports } from '@lumiris/mock-data';
import type { Passport, ScoreResult } from '@lumiris/types';
import { scorePassport } from '../passport-score';

interface AlternativeMatch {
    passport: Passport;
    score: ScoreResult;
}

// Renvoie des pièces A/B du même `garment.kind`, triées par grade puis prix croissant.
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
