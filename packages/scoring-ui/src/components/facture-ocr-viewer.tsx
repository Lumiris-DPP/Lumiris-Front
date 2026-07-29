'use client';

import type { HTMLAttributes } from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import type { SupplierInvoice } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { cn } from '@lumiris/ui/lib/cn';

export interface FactureOcrViewerProps extends HTMLAttributes<HTMLDivElement> {
    invoice: SupplierInvoice;
    confidence?: number;
}

export function FactureOcrViewer({
    invoice,
    confidence = invoice.ocrExtracted ? 0.85 : 0,
    className,
    ...rest
}: FactureOcrViewerProps) {
    const lowConfidence = invoice.ocrExtracted !== null && confidence < 0.7;
    const noOcr = invoice.ocrExtracted === null;

    return (
        <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)} {...rest}>
            <div className="flex items-start gap-3 bg-muted/40 px-4 py-3">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-foreground">{invoice.id}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{invoice.fileUrl}</p>
                </div>
                {noOcr ? (
                    <Badge
                        variant="outline"
                        className="border-lumiris-amber/40 bg-lumiris-amber/10 font-mono text-[10px] text-lumiris-amber"
                    >
                        OCR à faire
                    </Badge>
                ) : lowConfidence ? (
                    <Badge
                        variant="outline"
                        className="gap-1 border-lumiris-rose/40 bg-lumiris-rose/10 font-mono text-[10px] text-lumiris-rose"
                    >
                        <AlertTriangle className="h-3 w-3" /> conf. {Math.round(confidence * 100)}%
                    </Badge>
                ) : (
                    <Badge
                        variant="outline"
                        className="border-lumiris-emerald/40 bg-lumiris-emerald/10 font-mono text-[10px] text-lumiris-emerald"
                    >
                        OCR conf. {Math.round(confidence * 100)}%
                    </Badge>
                )}
            </div>

            <div className="space-y-3 px-4 py-3 text-xs">
                {invoice.ocrExtracted ? (
                    <>
                        <div className="grid grid-cols-2 gap-y-1.5">
                            <span className="text-muted-foreground">Fournisseur</span>
                            <span className="font-medium text-foreground">{invoice.ocrExtracted.supplierName}</span>
                            <span className="text-muted-foreground">Date facture</span>
                            <span className="text-foreground">{invoice.ocrExtracted.invoiceDate}</span>
                            <span className="text-muted-foreground">Total HT</span>
                            <span className="font-mono text-foreground">
                                {invoice.ocrExtracted.totalHt.toLocaleString('fr-FR')} {invoice.ocrExtracted.currency}
                            </span>
                        </div>
                        <div className="border-t border-border pt-2">
                            <p className="mb-1.5 text-[10px] tracking-wider text-muted-foreground uppercase">
                                Lignes ({invoice.ocrExtracted.lineItems.length})
                            </p>
                            <ul className="divide-y divide-border">
                                {invoice.ocrExtracted.lineItems.map((line, idx) => (
                                    <li key={idx} className="flex items-baseline justify-between gap-3 py-1.5">
                                        <span className="truncate text-foreground">
                                            {line.label}
                                            {line.fiber ? (
                                                <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                                                    [{line.fiber}]
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="font-mono text-[11px] text-foreground/80">
                                            {line.qty} {line.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                ) : (
                    <p className="text-muted-foreground italic">
                        Le passage OCR n&apos;a pas encore tourné - métadonnées indisponibles.
                    </p>
                )}
            </div>
        </div>
    );
}
