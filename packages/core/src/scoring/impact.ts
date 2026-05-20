// impact 25 % - carbone/eau/recyclé/transport (25 pts chacun) ; déclaré prime sur calculé (ACV externe)

import type { Passport, Material, ScoreReason } from '@lumiris/types';
import { FIBER_IMPACT_COEFFICIENTS, FIBER_WATER_COEFFICIENTS, IMPACT_BASELINE } from './constants';
import type { AxisResult } from './types';

const FALLBACK_WEIGHT_G = 400;

export function scoreImpact(passport: Passport): AxisResult {
    const reasons: ScoreReason[] = [];
    const composition = passport.materials;

    if (composition.length === 0 && !hasDeclaredImpact(passport)) {
        return {
            score: 0,
            reasons: [
                {
                    axis: 'impact',
                    message: "Composition vide et aucune empreinte déclarée - impossible de calculer l'impact.",
                    severity: 'error',
                },
            ],
        };
    }

    const weightG = passport.garment.dimensions?.weightG ?? FALLBACK_WEIGHT_G;
    const weightKg = weightG / 1000;

    const co2Kg =
        passport.carbonKg ??
        composition.reduce((sum, m) => {
            const coef = FIBER_IMPACT_COEFFICIENTS[m.fiber] ?? FIBER_IMPACT_COEFFICIENTS.other;
            return sum + (m.percentage / 100) * coef * weightKg;
        }, 0);
    const carbonPts = clamp(1 - co2Kg / IMPACT_BASELINE.carbonCeilingKg, 0, 1) * 25;

    const waterLiters =
        passport.waterLiters ??
        composition.reduce((sum, m) => {
            const coef = FIBER_WATER_COEFFICIENTS[m.fiber] ?? FIBER_WATER_COEFFICIENTS.other;
            return sum + (m.percentage / 100) * coef * weightKg;
        }, 0);
    const waterPts = clamp(1 - waterLiters / IMPACT_BASELINE.waterCeilingLiters, 0, 1) * 25;

    const recycledPct =
        passport.recycledPct ?? composition.filter(isRecycled).reduce((sum, m) => sum + m.percentage, 0);
    const recycledPts = clamp(recycledPct / IMPACT_BASELINE.recycledTargetPct, 0, 1) * 25;

    let transportPts = 25;
    if (typeof passport.transportKm === 'number') {
        transportPts = clamp(1 - passport.transportKm / IMPACT_BASELINE.transportCeilingKm, 0, 1) * 25;
    } else if (composition.length > 0) {
        const nonFrShare = composition
            .filter((m) => m.originCountry.toUpperCase() !== 'FR')
            .reduce((s, m) => s + m.percentage, 0);
        transportPts = clamp(1 - nonFrShare / 100, 0, 1) * 25;
    }

    if (carbonPts < 12) {
        reasons.push({
            axis: 'impact',
            message: `Empreinte carbone élevée (~${co2Kg.toFixed(1)} kgCO₂e).`,
            severity: 'warn',
        });
    }
    if (waterPts < 12) {
        reasons.push({
            axis: 'impact',
            message: `Consommation d'eau élevée (~${Math.round(waterLiters)} L).`,
            severity: 'warn',
        });
    }
    if (recycledPct === 0) {
        reasons.push({
            axis: 'impact',
            message: 'Aucune part recyclée déclarée.',
            severity: 'info',
        });
    }
    if (typeof passport.transportKm === 'number' && passport.transportKm > IMPACT_BASELINE.transportCeilingKm * 0.5) {
        reasons.push({
            axis: 'impact',
            message: `Transport important (${passport.transportKm} km déclarés).`,
            severity: 'info',
        });
    }

    const score = round(clamp(carbonPts + waterPts + recycledPts + transportPts, 0, 100));
    return { score, reasons };
}

function hasDeclaredImpact(passport: Passport): boolean {
    return (
        typeof passport.carbonKg === 'number' ||
        typeof passport.waterLiters === 'number' ||
        typeof passport.recycledPct === 'number' ||
        typeof passport.transportKm === 'number'
    );
}

function isRecycled(m: Material): boolean {
    return m.fiber === 'recycled-polyester';
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

function round(n: number): number {
    return Math.round(n * 10) / 10;
}
