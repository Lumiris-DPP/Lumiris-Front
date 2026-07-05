'use client';

import type { HTMLAttributes } from 'react';
import type { CareInstructions, PassportWarranty } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';

export interface CareGuideProps extends HTMLAttributes<HTMLDivElement> {
    care?: CareInstructions;
    warranty?: PassportWarranty;
}

const ITEMS: ReadonlyArray<{ key: keyof CareInstructions; label: string; svgPath: string }> = [
    { key: 'washing', label: 'Lavage', svgPath: '/ginetex/ginetex--washing.svg' },
    { key: 'drying', label: 'Séchage', svgPath: '/ginetex/ginetex--drying.svg' },
    { key: 'ironing', label: 'Repassage', svgPath: '/ginetex/ginetex--ironing.svg' },
    { key: 'storage', label: 'Stockage', svgPath: '/ginetex/ginetex--flat-drying.svg' },
];

export function CareGuide({ care, warranty, className, ...rest }: CareGuideProps) {
    return (
        <section className={cn('flex flex-col gap-4', className)} {...rest}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ITEMS.map(({ key, label, svgPath }) => {
                    const value = care?.[key];
                    return (
                        <li key={key} className="border-border/60 bg-card flex gap-3 rounded-2xl border p-3">
                            <img src={svgPath} alt="" aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-foreground text-xs font-semibold uppercase tracking-wider">
                                    {label}
                                </p>
                                <p
                                    className={cn(
                                        'mt-0.5 text-sm',
                                        value ? 'text-foreground/90' : 'text-muted-foreground italic',
                                    )}
                                >
                                    {value || 'Information à compléter'}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {warranty ? (
                <div className="border-lumiris-emerald/30 bg-lumiris-emerald/5 flex flex-col gap-1 rounded-2xl border p-4">
                    <p className="text-lumiris-emerald text-xs font-semibold uppercase tracking-wider">
                        Garantie {Math.round(warranty.durationMonths / 12)} an{warranty.durationMonths >= 24 ? 's' : ''}
                    </p>
                    <p className="text-foreground/90 text-sm">{warranty.terms}</p>
                    {warranty.repairabilityCommitment ? (
                        <p className="text-muted-foreground mt-1 text-xs italic">{warranty.repairabilityCommitment}</p>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
}
