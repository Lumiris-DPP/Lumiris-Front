'use client';

import type { HTMLAttributes } from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';
import type { ProductionStep } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { STAGE_LABEL } from '../theme/dpp-labels';

export interface ManufacturingTimelineProps extends HTMLAttributes<HTMLDivElement> {
    steps: readonly ProductionStep[];
}

export function ManufacturingTimeline({ steps, className, ...rest }: ManufacturingTimelineProps) {
    if (steps.length === 0) {
        return (
            <p className={cn('text-sm text-muted-foreground', className as string)} {...rest}>
                Aucune étape renseignée.
            </p>
        );
    }

    const cities = Array.from(new Map(steps.map((s) => [`${s.locationCity}-${s.locationCountry}`, s])).values());

    return (
        <div className={cn('space-y-4', className)} {...rest}>
            <ol className="relative space-y-4 border-l border-dashed pl-6">
                {steps.map((step, idx) => (
                    <li key={step.id} className="relative">
                        <span className="absolute -left-[35px] flex h-5 w-5 items-center justify-center rounded-full bg-lumiris-emerald/15 font-mono text-[10px] font-bold text-lumiris-emerald">
                            {idx + 1}
                        </span>
                        <div className="rounded-xl border border-border bg-card p-3">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="text-sm font-medium text-foreground">{step.label}</p>
                                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                                    {STAGE_LABEL[step.kind]}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {step.performedBy} · {step.locationCity}, {step.locationCountry}
                            </p>
                            {step.photos.length > 0 ? (
                                <div className="mt-2 flex gap-1.5">
                                    {step.photos.slice(0, 3).map((photo) => (
                                        <div key={photo} className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                                            <img src={photo} alt="" className="h-full w-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </li>
                ))}
            </ol>

            <div className="rounded-xl border border-border bg-card/50 p-3">
                <p className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                    <MapPin className="h-3 w-3" /> Lieux ({cities.length})
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {cities.map((c) => (
                        <li
                            key={`${c.locationCity}-${c.locationCountry}`}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5"
                        >
                            <CheckCircle2 className="h-3 w-3 text-lumiris-emerald" />
                            {c.locationCity} <span className="text-muted-foreground">({c.locationCountry})</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
