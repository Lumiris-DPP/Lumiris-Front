// réparabilité 10 % - retoucheurs proches (60) + fibres réparables pondérées (30) + garantie (10)

import type { Artisan, Passport, Fiber, Repairer, ScoreReason } from '@lumiris/types';
import type { AxisResult } from './types';

interface RepairabilityInput {
    artisan?: Artisan;
    retoucheurs?: readonly Repairer[];
}

const FIBER_REPAIRABILITY: Record<Fiber, number> = {
    wool: 30,
    linen: 30,
    leather: 30,
    cotton: 25,
    hemp: 25,
    silk: 20,
    cashmere: 25,
    'recycled-polyester': 15,
    other: 10,
};

export function scoreRepairability(passport: Passport, input: RepairabilityInput): AxisResult {
    const reasons: ScoreReason[] = [];
    const { artisan, retoucheurs = [] } = input;

    let retouchePts = 0;
    if (artisan) {
        const sameCity = retoucheurs.filter(
            (r) => r.city.trim().toLowerCase() === artisan.city.trim().toLowerCase(),
        ).length;
        if (sameCity >= 3) {
            retouchePts = 60;
        } else if (sameCity > 0) {
            retouchePts = sameCity * 20;
        } else {
            const nearby = retoucheurs.filter(
                (r) => typeof r.distanceKm === 'number' && (r.distanceKm ?? 99) <= 25,
            ).length;
            retouchePts = Math.min(20, nearby * 5);
            reasons.push({
                axis: 'repairability',
                message: `Aucun retoucheur partenaire dans ${artisan.city} - proposez la Garde-Robe Locale à vos clients.`,
                severity: 'warn',
            });
        }
    } else {
        reasons.push({
            axis: 'repairability',
            message: 'Profil artisan non fourni - disponibilité retoucheurs non évaluable.',
            severity: 'info',
        });
    }

    const composition = passport.materials;
    let fiberPts = 0;
    if (composition.length > 0) {
        const totalPct = composition.reduce((s, m) => s + m.percentage, 0) || 1;
        const weighted =
            composition.reduce(
                (sum, m) => sum + (FIBER_REPAIRABILITY[m.fiber] ?? FIBER_REPAIRABILITY.other) * m.percentage,
                0,
            ) / totalPct;
        fiberPts = (weighted / 30) * 30;
        if (weighted < 25) {
            reasons.push({
                axis: 'repairability',
                message: 'Composition peu réparable (synthétiques ou fibres délicates).',
                severity: 'info',
            });
        }
    }

    const months = passport.warranty.durationMonths;
    let warrantyPts = 0;
    if (months >= 24) warrantyPts = 10;
    else if (months >= 12) warrantyPts = 7;
    else if (months >= 6) warrantyPts = 4;
    else warrantyPts = 0;

    const score = round(Math.max(0, Math.min(100, retouchePts + fiberPts + warrantyPts)));
    return { score, reasons };
}

function round(n: number): number {
    return Math.round(n * 10) / 10;
}
