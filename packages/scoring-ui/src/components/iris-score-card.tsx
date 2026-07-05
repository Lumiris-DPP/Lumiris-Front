'use client';

import { useState, useEffect, type HTMLAttributes } from 'react';
import type { DppScoreInput, ScoreResult } from '@lumiris/types';
import { useApiClient } from '@lumiris/api-client/react';
import { cn } from '@lumiris/ui/lib/cn';
import { GRADE_LABEL } from '../theme/grade-color';
import { IrisGrade } from './iris-grade';
import { ScoreBreakdown } from './score-breakdown';
import { ScoreCapWarning } from './score-cap-warning';

const ZERO_SCORE: ScoreResult = {
    total: 0,
    grade: 'E',
    breakdown: { transparency: 0, craftsmanship: 0, impact: 0, repairability: 0 },
    weights: { transparency: 0.4, craftsmanship: 0.25, impact: 0.25, repairability: 0.1 },
    reasons: [],
};

interface DisplayProps extends HTMLAttributes<HTMLDivElement> {
    score: ScoreResult;
    muted?: boolean;
    variant?: 'card' | 'strip' | 'responsive';
}

function IrisScoreCardDisplay({ score, muted = false, variant = 'card', className, children, ...rest }: DisplayProps) {
    if (variant === 'responsive') {
        return (
            <>
                <IrisScoreCardDisplay score={score} muted={muted} className={cn('hidden lg:flex', className)} {...rest}>
                    {children}
                </IrisScoreCardDisplay>
                <IrisScoreCardDisplay
                    score={score}
                    muted={muted}
                    variant="strip"
                    className={cn('lg:hidden', className)}
                    {...rest}
                />
            </>
        );
    }

    if (variant === 'strip') {
        return (
            <div
                aria-label={`Score Iris ${score.grade} (${score.total} sur 100)`}
                className={cn(
                    'border-border bg-card flex items-center gap-3 rounded-lg border px-3 py-2',
                    muted && 'opacity-60',
                    className,
                )}
                {...rest}
            >
                <IrisGrade grade={score.grade} size="md" />
                <p className="text-foreground font-mono text-sm font-semibold">
                    {score.total.toFixed(1)}
                    <span className="text-muted-foreground/70 ml-0.5 text-xs font-normal">/ 100</span>
                </p>
            </div>
        );
    }

    return (
        <div
            aria-label={`Score Iris ${score.grade} (${score.total} sur 100)`}
            className={cn(
                'border-border bg-card flex flex-col gap-4 rounded-2xl border p-6',
                muted && 'opacity-60',
                className,
            )}
            {...rest}
        >
            <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
                Score Iris · {GRADE_LABEL[score.grade]}
            </p>
            <div className="flex items-center gap-3">
                <IrisGrade grade={score.grade} size="lg" aria-hidden />
                <p className="text-foreground font-mono text-2xl font-semibold">
                    {score.total.toFixed(1)}
                    <span className="text-muted-foreground/70 ml-0.5 text-sm font-normal">/ 100</span>
                </p>
            </div>
            <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
            {score.cap?.applied && <ScoreCapWarning cap={score.cap} />}
            {children && <div className="border-border border-t pt-3">{children}</div>}
        </div>
    );
}

export interface IrisScoreCardProps extends HTMLAttributes<HTMLDivElement> {
    dppId?: string | null;
    draft?: DppScoreInput;
    muted?: boolean;
    variant?: 'card' | 'strip' | 'responsive';
}

export function IrisScoreCard({ dppId, draft, muted, variant, className, children, ...rest }: IrisScoreCardProps) {
    const api = useApiClient();
    const [score, setScore] = useState<ScoreResult>(ZERO_SCORE);
    useEffect(() => {
        if (!dppId || dppId === 'null') {
            setScore(ZERO_SCORE);
            return;
        }
        api.dppForms
            .getIrisScore(dppId)
            .then(setScore)
            .catch(() => setScore(ZERO_SCORE));
    }, [dppId, api]);

    useEffect(() => {
        if (!draft) return;
        api.dppForms
            .computeIrisScore(draft)
            .then(setScore)
            .catch(() => null);
    }, [draft, api]);

    return (
        <IrisScoreCardDisplay score={score} muted={muted} variant={variant} className={className} {...rest}>
            {children}
        </IrisScoreCardDisplay>
    );
}
