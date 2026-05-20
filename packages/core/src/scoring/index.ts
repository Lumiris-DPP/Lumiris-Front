// scoring 40/25/25/10 - pur, déterministe, `now` toujours injecté ; identique admin/web/vision/atelier/Tauri

import type {
    Artisan,
    Passport,
    CertificationRef,
    IrisAxisBreakdown,
    Repairer,
    ScoreCap,
    ScoreReason,
    ScoreResult,
    ScoreWeights,
} from '@lumiris/types';
import { LUMIRIS_WEIGHTS } from './constants';
import { checkCaps } from './caps';
import { toIrisGrade } from './grade';
import { scoreCraftsmanship } from './craftsmanship';
import { scoreImpact } from './impact';
import { scoreRepairability } from './repairability';
import { scoreTransparency } from './transparency';

export * from './constants';
export { toIrisGrade, IRIS_THRESHOLDS } from './grade';
export { checkCaps } from './caps';
export { scoreTransparency } from './transparency';
export { scoreCraftsmanship } from './craftsmanship';
export { scoreImpact } from './impact';
export { scoreRepairability } from './repairability';

export interface ComputeScoreOptions {
    certificates: readonly CertificationRef[];
    retoucheurs?: readonly Repairer[];
    artisan?: Artisan;
    now: Date;
    weights?: Partial<ScoreWeights>;
}

export function computeScore(passport: Passport, options: ComputeScoreOptions): ScoreResult {
    const weights = normalizeWeights({ ...LUMIRIS_WEIGHTS, ...(options.weights ?? {}) });

    const capDecision = checkCaps(passport);

    const transparency = scoreTransparency(passport, options.now);
    const craftsmanship = scoreCraftsmanship(passport, {
        artisan: options.artisan,
        certificates: options.certificates,
        now: options.now,
    });
    const impact = scoreImpact(passport);
    const repairability = scoreRepairability(passport, {
        artisan: options.artisan,
        retoucheurs: options.retoucheurs,
    });

    const breakdown: IrisAxisBreakdown = {
        transparency: transparency.score,
        craftsmanship: craftsmanship.score,
        impact: impact.score,
        repairability: repairability.score,
    };

    const rawTotal =
        breakdown.transparency * weights.transparency +
        breakdown.craftsmanship * weights.craftsmanship +
        breakdown.impact * weights.impact +
        breakdown.repairability * weights.repairability;
    const total = round(rawTotal);

    const grade = toIrisGrade(total, capDecision.capped ? 'D' : undefined);

    const reasons: ScoreReason[] = [
        ...transparency.reasons,
        ...craftsmanship.reasons,
        ...impact.reasons,
        ...repairability.reasons,
    ];
    if (capDecision.capped) {
        reasons.push({
            axis: 'transparency',
            message: `Score plafonné à D - ${capDecision.reason ?? 'champ obligatoire manquant'}.`,
            severity: 'error',
        });
    }

    const cap: ScoreCap = capDecision.capped ? { applied: true, reason: capDecision.reason } : { applied: false };

    return {
        total,
        grade,
        breakdown,
        weights,
        reasons,
        cap,
    };
}

function normalizeWeights(w: ScoreWeights): ScoreWeights {
    const sum = w.transparency + w.craftsmanship + w.impact + w.repairability;
    if (sum === 0) return LUMIRIS_WEIGHTS;
    return {
        transparency: w.transparency / sum,
        craftsmanship: w.craftsmanship / sum,
        impact: w.impact / sum,
        repairability: w.repairability / sum,
    };
}

function round(n: number): number {
    return Math.round(n * 10) / 10;
}
