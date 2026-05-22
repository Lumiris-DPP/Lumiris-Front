'use client';

import type { SupplierInvoice } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { cn } from '@lumiris/ui/lib/cn';
import { supplierLabel } from './picker-shared';

interface InvoiceListProps {
    invoices: readonly SupplierInvoice[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function InvoiceList({ invoices, selectedId, onSelect }: InvoiceListProps) {
    if (invoices.length === 0) {
        return (
            <div className="border-border bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                Aucune facture liée à votre atelier pour l’instant. En production, importez vos PDF fournisseurs.
            </div>
        );
    }
    return (
        <div className="space-y-2">
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                Factures de l’atelier ({invoices.length})
            </p>
            <ul className="space-y-2">
                {invoices.map((inv) => {
                    const active = inv.id === selectedId;
                    const ocr = inv.ocrExtracted;
                    return (
                        <li key={inv.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(inv.id)}
                                aria-pressed={active}
                                aria-label={`Sélectionner la facture ${inv.id}`}
                                className={cn(
                                    'border-border bg-card hover:bg-muted/50 flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors',
                                    active &&
                                        'border-lumiris-emerald/60 bg-lumiris-emerald/5 ring-lumiris-emerald/20 ring-2',
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-foreground truncate text-sm font-medium">
                                            {ocr?.supplierName ?? supplierLabel(inv.supplierId)}
                                        </p>
                                        <p className="text-muted-foreground truncate font-mono text-[11px]">{inv.id}</p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'shrink-0 font-mono text-[10px]',
                                            ocr
                                                ? 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald'
                                                : 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
                                        )}
                                    >
                                        {ocr ? 'OCR ✓' : 'OCR à faire'}
                                    </Badge>
                                </div>
                                <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                                    <span>
                                        {ocr ? ocr.invoiceDate : new Date(inv.uploadedAt).toLocaleDateString('fr-FR')}
                                    </span>
                                    <span className="font-mono">
                                        {ocr ? `${ocr.totalHt.toLocaleString('fr-FR')} ${ocr.currency}` : '—'}
                                    </span>
                                </div>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
