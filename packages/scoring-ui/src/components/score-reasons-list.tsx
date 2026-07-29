'use client';

import type { ComponentType, HTMLAttributes } from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { ScoreReason } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { AXIS_COLOR, AXIS_LABEL } from '../theme/grade-color';

export interface ScoreReasonsListProps extends HTMLAttributes<HTMLUListElement> {
    reasons: readonly ScoreReason[];
    limit?: number;
    emptyLabel?: string;
}

const SEVERITY_ICON: Record<ScoreReason['severity'], ComponentType<{ className?: string }>> = {
    info: Info,
    warn: AlertTriangle,
    error: AlertCircle,
};

const SEVERITY_TEXT_CLASS: Record<ScoreReason['severity'], string> = {
    info: 'text-muted-foreground',
    warn: 'text-lumiris-amber',
    error: 'text-lumiris-rose',
};

export function ScoreReasonsList({
    reasons,
    limit,
    emptyLabel = 'Aucun motif détecté.',
    className,
    ...rest
}: ScoreReasonsListProps) {
    if (reasons.length === 0) {
        return <p className={cn('text-sm text-muted-foreground', className as string)}>{emptyLabel}</p>;
    }

    const visible = limit ? reasons.slice(0, limit) : reasons;
    const overflow = limit ? Math.max(0, reasons.length - limit) : 0;

    return (
        <ul className={cn('space-y-1.5 text-sm', className)} {...rest}>
            {visible.map((reason, i) => {
                const Icon = SEVERITY_ICON[reason.severity];
                const axisColor = `text-${AXIS_COLOR[reason.axis]}`;
                return (
                    <li key={`${i}-${reason.axis}-${reason.message}`} className="flex items-start gap-2">
                        <Icon
                            className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', SEVERITY_TEXT_CLASS[reason.severity])}
                            aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                            <span className={cn('mr-2 text-[10px] font-semibold tracking-wider uppercase', axisColor)}>
                                {AXIS_LABEL[reason.axis]}
                            </span>
                            <span className="text-foreground">{reason.message}</span>
                        </div>
                    </li>
                );
            })}
            {overflow > 0 ? <li className="pl-5 text-xs text-muted-foreground italic">+ {overflow} de plus</li> : null}
        </ul>
    );
}
