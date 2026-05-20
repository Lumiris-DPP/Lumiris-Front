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
        <div className={cn('border-border bg-card overflow-hidden rounded-xl border', className)} {...rest}>
            <div className="bg-muted/40 flex items-start gap-3 px-4 py-3">
                <FileText className="text-muted-foreground mt-0.5 h-4 w-4" />
                <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate font-mono text-xs">{invoice.id}</p>
                    <p className="text-muted-foreground truncate text-[11px]">{invoice.fileUrl}</p>
                </div>
                {noOcr ? (
                    <Badge
                        variant="outline"
                        className="border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber font-mono text-[10px]"
                    >
                        OCR à faire
                    </Badge>
                ) : lowConfidence ? (
                    <Badge
                        variant="outline"
                        className="border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose gap-1 font-mono text-[10px]"
                    >
                        <AlertTriangle className="h-3 w-3" /> conf. {Math.round(confidence * 100)}%
                    </Badge>
                ) : (
                    <Badge
                        variant="outline"
                        className="border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald font-mono text-[10px]"
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
                            <span className="text-foreground font-medium">{invoice.ocrExtracted.supplierName}</span>
                            <span className="text-muted-foreground">Date facture</span>
                            <span className="text-foreground">{invoice.ocrExtracted.invoiceDate}</span>
                            <span className="text-muted-foreground">Total HT</span>
                            <span className="text-foreground font-mono">
                                {invoice.ocrExtracted.totalHt.toLocaleString('fr-FR')} {invoice.ocrExtracted.currency}
                            </span>
                        </div>
                        <div className="border-border border-t pt-2">
                            <p className="text-muted-foreground mb-1.5 text-[10px] uppercase tracking-wider">
                                Lignes ({invoice.ocrExtracted.lineItems.length})
                            </p>
                            <ul className="divide-border divide-y">
                                {invoice.ocrExtracted.lineItems.map((line, idx) => (
                                    <li key={idx} className="flex items-baseline justify-between gap-3 py-1.5">
                                        <span className="text-foreground truncate">
                                            {line.label}
                                            {line.fiber ? (
                                                <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">
                                                    [{line.fiber}]
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="text-foreground/80 font-mono text-[11px]">
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
