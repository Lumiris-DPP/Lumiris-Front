'use client';

import type { HTMLAttributes } from 'react';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { getEffectiveStatus } from '@lumiris/types';
import type { CertificationRef, Material } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { cn } from '@lumiris/ui/lib/cn';
import { FIBER_LABEL } from '../theme/dpp-labels';

export interface CompositionListProps extends HTMLAttributes<HTMLDivElement> {
    composition: readonly Material[];
    now: Date;
    resolveSupplier?: (supplierId: string) => string | undefined;
}

export function CompositionList({ composition, now, resolveSupplier, className, ...rest }: CompositionListProps) {
    if (composition.length === 0) {
        return (
            <p className={cn('text-muted-foreground text-sm', className as string)} {...rest}>
                Composition non renseignée.
            </p>
        );
    }

    return (
        <div className={cn('space-y-3', className)} {...rest}>
            {composition.map((entry, idx) => {
                const supplierName = entry.supplierId
                    ? (resolveSupplier?.(entry.supplierId) ?? entry.supplierId)
                    : '- fournisseur manquant';
                return (
                    <div key={`${idx}-${entry.fiber}`} className="border-border bg-card rounded-xl border p-4">
                        <div className="flex items-baseline justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-foreground truncate text-sm font-medium">
                                    {FIBER_LABEL[entry.fiber]}
                                </p>
                                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                    {supplierName} · {entry.originCountry || '-'}
                                </p>
                            </div>
                            <span className="text-foreground font-mono text-sm font-bold">{entry.percentage}%</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {entry.certifications.length === 0 ? (
                                <span className="text-muted-foreground text-[11px] italic">
                                    Aucune certification fibre
                                </span>
                            ) : (
                                entry.certifications.map((cert) => <CertChip key={cert.id} cert={cert} now={now} />)
                            )}
                        </div>
                        {entry.invoiceRef ? (
                            <p className="text-muted-foreground mt-2 font-mono text-[10px]">
                                facture: {entry.invoiceRef}
                            </p>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

function CertChip({ cert, now }: { cert: CertificationRef; now: Date }) {
    const status = getEffectiveStatus(cert, now);
    const expired = status === 'Expired';
    const unverified = status === 'Unverified';
    const Icon = expired ? ShieldX : ShieldCheck;
    return (
        <Badge
            variant="outline"
            className={cn(
                'text-foreground gap-1 font-mono text-[11px]',
                expired && 'border-lumiris-rose/40 bg-lumiris-rose/10',
                unverified && 'border-lumiris-amber/40 bg-lumiris-amber/10',
                !expired && !unverified && 'border-lumiris-emerald/40 bg-lumiris-emerald/10',
            )}
        >
            <Icon
                aria-hidden
                className={cn(
                    'h-3 w-3',
                    expired && 'text-lumiris-rose',
                    unverified && 'text-lumiris-amber',
                    !expired && !unverified && 'text-lumiris-emerald',
                )}
            />
            {cert.kind}
            {expired ? ' · expirée' : null}
            {unverified ? ' · non vérifiée' : null}
        </Badge>
    );
}
