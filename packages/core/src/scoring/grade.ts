import type { IrisGrade } from '@lumiris/types';

export const IRIS_THRESHOLDS = { A: 80, B: 65, C: 50, D: 35 } as const;

export function toIrisGrade(total: number, cap?: 'D'): IrisGrade {
    if (!Number.isFinite(total)) return 'E';
    if (cap === 'D') return total < IRIS_THRESHOLDS.D ? 'E' : 'D';
    if (total >= IRIS_THRESHOLDS.A) return 'A';
    if (total >= IRIS_THRESHOLDS.B) return 'B';
    if (total >= IRIS_THRESHOLDS.C) return 'C';
    if (total >= IRIS_THRESHOLDS.D) return 'D';
    return 'E';
}
