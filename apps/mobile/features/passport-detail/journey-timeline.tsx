'use client';

import { MapPin } from 'lucide-react';
import type { IrisGrade, ProductionStep } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { GRADE_LINE, GRADE_BORDER, GRADE_DOT_BG } from './grade-classes';

const COUNTRY_FLAG: Record<string, string> = {
    FR: '🇫🇷',
    IT: '🇮🇹',
    ES: '🇪🇸',
    BE: '🇧🇪',
    PT: '🇵🇹',
    DE: '🇩🇪',
    UK: '🇬🇧',
    GB: '🇬🇧',
    MA: '🇲🇦',
    TN: '🇹🇳',
};

interface JourneyTimelineProps {
    steps: readonly ProductionStep[];
    grade: IrisGrade;
}

export function JourneyTimeline({ steps, grade }: JourneyTimelineProps) {
    if (steps.length === 0) {
        return <p className="text-sm text-muted-foreground italic">Aucune étape renseignée pour cette pièce.</p>;
    }

    return (
        <ol className="relative">
            <span aria-hidden className={cn('absolute top-3 bottom-3 left-3 w-px', GRADE_LINE[grade])} />
            {steps.map((step, idx) => (
                <li key={step.id} className={cn('relative flex gap-4', idx === steps.length - 1 ? 'pb-0' : 'pb-4')}>
                    <span
                        aria-hidden
                        className={cn(
                            'absolute top-3 left-3 -translate-x-1/2 rounded-full border-2',
                            'h-3 w-3',
                            GRADE_BORDER[grade],
                            GRADE_DOT_BG[grade],
                        )}
                    />
                    <div className="ml-8 flex-1 rounded-xl border border-border bg-card p-3">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-foreground uppercase">
                                <MapPin className="h-3 w-3" aria-hidden />
                                {step.label}
                            </p>
                            {step.performedAt ? (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                    {formatDate(step.performedAt)}
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            <span className="mr-1">{COUNTRY_FLAG[step.locationCountry] ?? '🏳️'}</span>
                            {step.locationCity}, {step.locationCountry}
                        </p>
                        <p className="mt-0.5 text-[11px] text-foreground/70">par {step.performedBy}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return iso;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
}
