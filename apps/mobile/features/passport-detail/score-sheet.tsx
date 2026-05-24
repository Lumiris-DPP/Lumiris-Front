'use client';

import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@lumiris/ui/components/sheet';
import { ScoreCapWarning, ScoreReasonsList, AXIS_LABEL } from '@lumiris/scoring-ui';
import { LUMIRIS_WEIGHTS } from '@lumiris/core/scoring';
import type { IrisAxis, ScoreReason, ScoreResult } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';

const AXES: readonly IrisAxis[] = ['transparency', 'craftsmanship', 'impact', 'repairability'];

const AXIS_BAR_BG: Record<IrisAxis, string> = {
    transparency: 'bg-lumiris-emerald',
    craftsmanship: 'bg-lumiris-cyan',
    impact: 'bg-lumiris-amber',
    repairability: 'bg-lumiris-iris',
};

const AXIS_TEXT: Record<IrisAxis, string> = {
    transparency: 'text-lumiris-emerald',
    craftsmanship: 'text-lumiris-cyan',
    impact: 'text-lumiris-amber',
    repairability: 'text-lumiris-iris',
};

interface ScoreSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    score: ScoreResult;
}

export function ScoreSheet({ open, onOpenChange, score }: ScoreSheetProps) {
    const reasonsByAxis = useMemo(() => {
        const buf: Record<IrisAxis, ScoreReason[]> = {
            transparency: [],
            craftsmanship: [],
            impact: [],
            repairability: [],
        };
        for (const reason of score.reasons) buf[reason.axis].push(reason);
        return buf;
    }, [score.reasons]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-t-2xl pb-8">
                <SheetHeader className="pb-1 pt-5">
                    <SheetTitle className="text-foreground text-base">Détail du score Iris V2</SheetTitle>
                    <SheetDescription>
                        Score total {score.total.toFixed(1)} / 100 - réparti sur 4 piliers.
                    </SheetDescription>
                </SheetHeader>

                {score.cap?.applied ? (
                    <div className="px-4 pb-2">
                        <ScoreCapWarning cap={score.cap} />
                    </div>
                ) : null}

                <ul className="space-y-5 px-4 pb-4">
                    {AXES.map((axis) => {
                        const value = score.breakdown[axis];
                        const weight = score.weights[axis] ?? LUMIRIS_WEIGHTS[axis];
                        const cap = weight * 100;
                        const weighted = (value * weight).toFixed(1);
                        const pct = Math.max(0, Math.min(100, value));
                        const reasons = reasonsByAxis[axis];

                        return (
                            <li key={axis} className="space-y-2">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p
                                        className={cn(
                                            'text-xs font-semibold uppercase tracking-wider',
                                            AXIS_TEXT[axis],
                                        )}
                                    >
                                        {AXIS_LABEL[axis]} ·{' '}
                                        <span className="text-muted-foreground font-mono lowercase">
                                            {(weight * 100).toFixed(0)}%
                                        </span>
                                    </p>
                                    <span className="text-foreground font-mono text-xs">
                                        {weighted} / {cap.toFixed(0)}
                                    </span>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuenow={value}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={`${AXIS_LABEL[axis]} - ${value.toFixed(0)} sur 100`}
                                    className="bg-muted h-2 overflow-hidden rounded-full"
                                >
                                    <div
                                        className={cn('h-full rounded-full transition-[width]', AXIS_BAR_BG[axis])}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                {reasons.length > 0 ? (
                                    <ScoreReasonsList reasons={reasons} className="mt-2 space-y-1.5" />
                                ) : null}
                            </li>
                        );
                    })}
                </ul>

                <p className="text-muted-foreground border-border/50 border-t px-4 pt-4 text-[11px] italic leading-relaxed">
                    LUMIRIS ne peut pas être payé pour modifier ce score. Les coefficients sont publics et identiques
                    pour tous les passeports.
                </p>
            </SheetContent>
        </Sheet>
    );
}
