'use client';

import type { HTMLAttributes } from 'react';
import { LUMIRIS_WEIGHTS } from '@lumiris/core/scoring';
import type { IrisAxis, ScoreBreakdown as ScoreBreakdownData, ScoreWeights } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { AXIS_COLOR, AXIS_LABEL } from '../theme/grade-color';

export interface ScoreBreakdownProps extends HTMLAttributes<HTMLDivElement> {
    breakdown: ScoreBreakdownData;
    weights?: ScoreWeights;
}

const AXES_ORDER: readonly IrisAxis[] = ['transparency', 'craftsmanship', 'impact', 'repairability'];
const DISABLED_AXES = new Set<IrisAxis>(['impact']);

export function ScoreBreakdown({ breakdown, weights = LUMIRIS_WEIGHTS, className, ...rest }: ScoreBreakdownProps) {
    return (
        <div className={cn('space-y-2', className)} {...rest}>
            {AXES_ORDER.map((axis) => {
                const disabled = DISABLED_AXES.has(axis);
                const score = disabled ? 0 : breakdown[axis];
                const weight = weights[axis];
                const cap = weight * 100;
                const weighted = (score * weight).toFixed(1);
                const tone = `bg-${AXIS_COLOR[axis]}`;

                const row = (
                    <div key={axis} className={cn('space-y-1', disabled && 'select-none opacity-40')}>
                        <div className="flex items-baseline justify-between text-xs">
                            <span className="text-foreground font-medium">{AXIS_LABEL[axis]}</span>
                            <span className="text-muted-foreground font-mono">
                                {weighted} / {cap.toFixed(0)}
                            </span>
                        </div>
                        <div
                            className="bg-muted h-2 overflow-hidden rounded-full"
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

                if (!disabled) return row;

                return (
                    <Tooltip key={axis}>
                        <TooltipTrigger asChild>
                            <div className="cursor-default">{row}</div>
                        </TooltipTrigger>
                        <TooltipContent>À venir</TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    );
}
