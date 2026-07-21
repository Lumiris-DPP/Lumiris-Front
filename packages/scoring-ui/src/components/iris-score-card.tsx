'use client';

import { useState, useEffect, type HTMLAttributes } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { DppScoreInput, ScoreResult } from '@lumiris/types';
import { useApiClient } from '@lumiris/api-client/react';
import { cn } from '@lumiris/ui/lib/cn';
import { GRADE_LABEL } from '../theme/grade-color';
import { IrisGrade } from './iris-grade';
import { IrisMethodologyInfo } from './iris-methodology-info';
import { ScoreBreakdown } from './score-breakdown';
import { ScoreCapWarning } from './score-cap-warning';

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
            <div className="flex items-center gap-1.5">
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
                    Score Iris · {GRADE_LABEL[score.grade]}
                </p>
                <IrisMethodologyInfo className="ml-auto" />
            </div>
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

type StatusTone = 'loading' | 'error';

interface StatusProps extends HTMLAttributes<HTMLDivElement> {
    tone: StatusTone;
    variant?: 'card' | 'strip' | 'responsive';
    onRetry?: () => void;
}

// Neutral loading / error surface — deliberately NOT a grade, so a network hiccup can never
// be mistaken for a genuine low (E) score.
function IrisScoreCardStatus({ tone, variant = 'card', className, onRetry, ...rest }: StatusProps) {
    const isStrip = variant === 'strip';
    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={tone === 'loading' ? 'Calcul du score Iris en cours' : 'Score Iris indisponible'}
            className={cn(
                'border-border bg-card flex items-center gap-3 border',
                isStrip ? 'rounded-lg px-3 py-2' : 'rounded-2xl p-6',
                className,
            )}
            {...rest}
        >
            {tone === 'loading' ? (
                <>
                    <Loader2 className="text-muted-foreground h-5 w-5 shrink-0 animate-spin" aria-hidden />
                    <p className="text-muted-foreground text-sm">Calcul du score Iris…</p>
                </>
            ) : (
                <>
                    <AlertCircle className="text-lumiris-amber h-5 w-5 shrink-0" aria-hidden />
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <p className="text-muted-foreground text-sm">Score indisponible</p>
                        {onRetry && (
                            <button
                                type="button"
                                onClick={onRetry}
                                className="text-foreground hover:text-lumiris-cyan inline-flex shrink-0 items-center gap-1 text-xs font-medium underline underline-offset-2"
                            >
                                <RefreshCw className="h-3 w-3" aria-hidden />
                                Réessayer
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export interface IrisScoreCardProps extends HTMLAttributes<HTMLDivElement> {
    /** Fetches the persisted score of a published DPP from the backend. */
    dppId?: string | null;
    /** Computes a live score for an in-progress draft via the backend. */
    draft?: DppScoreInput;
    /** Renders a locally computed score directly, without any backend call. */
    score?: ScoreResult;
    muted?: boolean;
    variant?: 'card' | 'strip' | 'responsive';
}

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export function IrisScoreCard({
    dppId,
    draft,
    score: providedScore,
    muted,
    variant,
    className,
    children,
    ...rest
}: IrisScoreCardProps) {
    const api = useApiClient();
    const [state, setState] = useState<{ status: FetchStatus; score: ScoreResult | null }>({
        status: 'idle',
        score: null,
    });
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        // A directly provided score never triggers a backend call.
        if (providedScore) return;

        let promise: Promise<ScoreResult>;
        if (dppId) promise = api.dpp.getIrisScore(dppId);
        else if (draft) promise = api.dpp.computeIrisScore(draft);
        else return; // nothing to fetch (e.g. wizard mid-navigation) — keep whatever we have

        let cancelled = false;
        // Preserve any previously computed score while recomputing, to avoid flicker on edits.
        setState((prev) => ({ status: 'loading', score: prev.score }));
        promise
            .then((s) => {
                if (!cancelled) setState({ status: 'success', score: s });
            })
            .catch(() => {
                if (!cancelled) setState((prev) => ({ status: 'error', score: prev.score }));
            });
        return () => {
            cancelled = true;
        };
    }, [dppId, draft, providedScore, api, reloadKey]);

    const displayScore = providedScore ?? state.score;

    // A real score (provided or last successfully fetched) always wins — including a
    // legitimately low one, and a stale-but-real value while a refetch is in flight.
    if (displayScore) {
        return (
            <IrisScoreCardDisplay
                score={displayScore}
                muted={muted}
                variant={variant}
                className={className}
                {...rest}
            >
                {children}
            </IrisScoreCardDisplay>
        );
    }

    if (state.status === 'error') {
        return (
            <IrisScoreCardStatus
                tone="error"
                variant={variant}
                className={className}
                onRetry={() => setReloadKey((k) => k + 1)}
                {...rest}
            />
        );
    }

    if (state.status === 'loading') {
        return <IrisScoreCardStatus tone="loading" variant={variant} className={className} {...rest} />;
    }

    // Idle with nothing to show yet (no id/draft/score) — render nothing rather than a fake grade.
    return null;
}
