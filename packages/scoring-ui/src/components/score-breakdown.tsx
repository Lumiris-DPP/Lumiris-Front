'use client';

import type { HTMLAttributes } from 'react';
import { LUMIRIS_WEIGHTS } from '@lumiris/core/scoring';
import type { IrisAxis, ScoreBreakdown as ScoreBreakdownData, ScoreWeights } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { AXIS_COLOR, AXIS_LABEL } from '../theme/grade-color';

export interface ScoreBreakdownProps extends HTMLAttributes<HTMLDivElement> {
    breakdown: ScoreBreakdownData;
    weights?: ScoreWeights;
}

const AXES_ORDER: readonly IrisAxis[] = ['transparency', 'craftsmanship', 'impact', 'repairability'];

export function ScoreBreakdown({ breakdown, weights = LUMIRIS_WEIGHTS, className, ...rest }: ScoreBreakdownProps) {
    return (
        <div className={cn('space-y-2', className)} {...rest}>
            {AXES_ORDER.map((axis) => {
                const score = breakdown[axis];
                const weight = weights[axis];
                const cap = weight * 100;
                const weighted = (score * weight).toFixed(1);
                const tone = `bg-${AXIS_COLOR[axis]}`;
                return (
                    <div key={axis} className="space-y-1">
                        <div className="flex items-baseline justify-between text-xs">
                            <span className="font-medium text-foreground">{AXIS_LABEL[axis]}</span>
                            <span className="font-mono text-muted-foreground">
                                {weighted} / {cap.toFixed(0)}
                            </span>
                        </div>
                        <div
                            className="h-2 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-valuenow={score}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${AXIS_LABEL[axis]} sub-score`}
                        >
                            <div
                                className={cn('h-full rounded-full transition-[width]', tone)}
                                style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
