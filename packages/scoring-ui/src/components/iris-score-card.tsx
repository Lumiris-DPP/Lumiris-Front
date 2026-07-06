'use client';

import type { HTMLAttributes } from 'react';
import type { ScoreResult } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { GRADE_LABEL } from '../theme/grade-color';
import { IrisGrade } from './iris-grade';
import { ScoreBreakdown } from './score-breakdown';
import { ScoreCapWarning } from './score-cap-warning';

export interface IrisScoreCardProps extends HTMLAttributes<HTMLDivElement> {
    score: ScoreResult;
    muted?: boolean;
}

export function IrisScoreCard({ score, muted = false, className, ...rest }: IrisScoreCardProps) {
    return (
        <div
            aria-label={`Score Iris ${score.grade} (${score.total} sur 100)`}
            className={cn(
                'border-border bg-card flex flex-col gap-6 rounded-2xl border p-6',
                muted && 'opacity-60',
                className,
            )}
            {...rest}
        >
            <div className="flex items-center gap-5">
                <IrisGrade grade={score.grade} size="xl" tone="solid" shape="square" aria-hidden />
                <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                        Score Iris LUMIRIS
                    </p>
                    <p className="text-foreground mt-1 text-2xl font-semibold">
                        {GRADE_LABEL[score.grade]} - {score.total.toFixed(1)} / 100
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">Calculé sur 4 piliers · 40 / 25 / 25 / 10</p>
                </div>
            </div>

            <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />

            {score.cap?.applied && <ScoreCapWarning cap={score.cap} />}
        </div>
    );
}
