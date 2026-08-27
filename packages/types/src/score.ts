export const IRIS_GRADES = ['A', 'B', 'C', 'D', 'E'] as const;

export type IrisGrade = (typeof IRIS_GRADES)[number];

export type IrisAxis = 'transparency' | 'craftsmanship' | 'impact' | 'repairability';

export type IrisAxisBreakdown = Record<IrisAxis, number>;

export interface ScoreWeights {
    transparency: number;
    craftsmanship: number;
    impact: number;
    repairability: number;
}

export type ScoreBreakdown = IrisAxisBreakdown;

export type ScoreReasonSeverity = 'info' | 'warn' | 'error';

export interface ScoreReason {
    axis: IrisAxis;
    message: string;
    severity: ScoreReasonSeverity;
}

export interface ScoreCap {
    applied: boolean;
    reason?: string;
}

export interface ScoreResult {
    total: number;
    grade: IrisGrade;
    breakdown: IrisAxisBreakdown;
    weights: ScoreWeights;
    reasons: readonly ScoreReason[];
    cap?: ScoreCap;
}

export interface DppScoreInputMaterial {
    fiber?: string;
    percentage?: number;
    originCountry?: string;
}

/**
 * Entrée de la prévisualisation Iris.
 */
export interface DppScoreInput {
    originCountry?: string;
    productCategory?: string;
    repairable?: boolean;
    reachCompliant?: boolean;
    endOfLifeInstructions?: string;
    weightGrams?: number;
    recycledPct?: number;
    warrantyMonths?: number;
    materials?: DppScoreInputMaterial[];
    presentDocuments?: string[];
}
