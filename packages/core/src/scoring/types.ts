import type { ScoreReason } from '@lumiris/types';

export interface AxisResult {
    score: number;
    reasons: readonly ScoreReason[];
}
