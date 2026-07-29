'use client';

import type { HTMLAttributes } from 'react';
import { Info } from 'lucide-react';
import type { Passport, ScoreResult } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';

export interface PassportStatusBannerProps extends HTMLAttributes<HTMLDivElement> {
    passport: Passport;
    score?: ScoreResult;
}

export function PassportStatusBanner({ passport, score, className, ...rest }: PassportStatusBannerProps) {
    const inCompletion = passport.status === 'InCompletion';
    const capped = score?.cap?.applied === true;

    if (!inCompletion && !capped) return null;

    const message = inCompletion
        ? 'Passeport en cours de complétion - certaines informations sont en cours de validation.'
        : 'Score plafonné - un ou plusieurs champs ESPR/AGEC obligatoires manquent.';
    const detail = capped && score?.cap?.reason ? score.cap.reason : undefined;

    return (
        <div
            role="status"
            className={cn(
                'flex items-start gap-3 rounded-2xl border border-lumiris-amber/30 bg-lumiris-amber/10 p-3 text-lumiris-amber',
                className,
            )}
            {...rest}
        >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="min-w-0">
                <p className="text-sm font-medium text-foreground/90">{message}</p>
                {detail ? <p className="mt-1 font-mono text-[11px] text-foreground/70">{detail}</p> : null}
            </div>
        </div>
    );
}
