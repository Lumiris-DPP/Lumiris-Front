'use client';

import { useMemo, type HTMLAttributes } from 'react';
import { AGEC_REQUIRED_FIELDS, ESPR_REQUIRED_FIELDS, checkCaps } from '@lumiris/core/scoring';
import type { Passport } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';

export interface MissingFieldsBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    passport: Passport;
    showWhenComplete?: boolean;
}

export function MissingFieldsBadge({
    passport,
    showWhenComplete = false,
    className,
    ...rest
}: MissingFieldsBadgeProps) {
    const { missing, total } = useMemo(() => computeMissing(passport), [passport]);

    if (missing === 0 && !showWhenComplete) return null;

    const tone =
        missing === 0
            ? 'border-lumiris-emerald/30 bg-lumiris-emerald/10 text-lumiris-emerald'
            : missing <= 2
              ? 'border-lumiris-amber/30 bg-lumiris-amber/10 text-lumiris-amber'
              : 'border-lumiris-rose/30 bg-lumiris-rose/10 text-lumiris-rose';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium',
                tone,
                className,
            )}
            title={
                missing === 0
                    ? 'Tous les champs ESPR / AGEC obligatoires sont renseignés'
                    : `${missing} champ${missing > 1 ? 's' : ''} obligatoire${missing > 1 ? 's' : ''} manquant${missing > 1 ? 's' : ''}`
            }
            {...rest}
        >
            {missing}/{total}
        </span>
    );
}

function computeMissing(passport: Passport): { missing: number; total: number } {
    const decision = checkCaps(passport);
    const total = ESPR_REQUIRED_FIELDS.length + AGEC_REQUIRED_FIELDS.length;
    return { missing: decision.missingFields.length, total };
}
