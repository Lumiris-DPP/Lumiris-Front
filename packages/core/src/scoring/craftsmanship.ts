// savoir-faire 25 % - part artisanale (50) + labels EPV/OFG/CUSTOM (30) + garantie (20)

import type { Artisan, Passport, CertificationRef, ScoreReason } from '@lumiris/types';
import { getEffectiveWeight } from '@lumiris/types';
import type { AxisResult } from './types';

interface CraftsmanshipInput {
    artisan?: Artisan;
    certificates: readonly CertificationRef[];
    now: Date;
}

export function scoreCraftsmanship(passport: Passport, input: CraftsmanshipInput): AxisResult {
    const reasons: ScoreReason[] = [];
    const { artisan, certificates, now } = input;

    const steps = passport.steps;
    let artisanShare = 0;
    if (steps.length > 0 && artisan) {
        const artisanIdentities = new Set(
            [artisan.displayName, artisan.atelierName].filter(Boolean).map((s) => s.trim().toLowerCase()),
        );
        const performedByArtisan = steps.filter((s) =>
            artisanIdentities.has(s.performedBy.trim().toLowerCase()),
        ).length;
        artisanShare = performedByArtisan / steps.length;
        if (performedByArtisan === 0) {
            reasons.push({
                axis: 'craftsmanship',
                message: "Aucune étape réalisée directement par l'artisan ou son atelier.",
                severity: 'warn',
            });
        }
    } else if (steps.length === 0) {
        reasons.push({
            axis: 'craftsmanship',
            message: 'Aucune étape pour mesurer la part artisanale.',
            severity: 'error',
        });
    } else if (!artisan) {
        reasons.push({
            axis: 'craftsmanship',
            message: 'Profil artisan non fourni - part artisanale non évaluable.',
            severity: 'warn',
        });
    }
    const artisanPts = artisanShare * 50;

    let labelsPts = 0;
    if (artisan?.epvLabeled) labelsPts += 20;
    else
        reasons.push({
            axis: 'craftsmanship',
            message: 'Pas de label EPV (Entreprise du Patrimoine Vivant).',
            severity: 'info',
        });
    if (artisan?.ofgLabeled) labelsPts += 10;

    const customCerts = certificates.filter((c) => c.kind === 'CUSTOM');
    const customWeight = customCerts.reduce((acc, c) => acc + getEffectiveWeight(c, now), 0);
    labelsPts += customWeight * 5;
    labelsPts = Math.min(30, labelsPts);

    const months = passport.warranty.durationMonths;
    let warrantyPts = 0;
    if (months >= 24) warrantyPts = 20;
    else if (months >= 12) warrantyPts = 15;
    else if (months >= 6) warrantyPts = 10;
    else warrantyPts = 0;
    if (months < 24) {
        reasons.push({
            axis: 'craftsmanship',
            message: `Garantie ${months} mois - passez à 24 mois pour atteindre le palier maximum.`,
            severity: 'info',
        });
    }

    const score = round(Math.max(0, Math.min(100, artisanPts + labelsPts + warrantyPts)));
    return { score, reasons };
}

function round(n: number): number {
    return Math.round(n * 10) / 10;
}
