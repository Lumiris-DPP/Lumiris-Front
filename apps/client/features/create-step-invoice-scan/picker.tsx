'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@lumiris/ui/components/dialog';
import { buildInitialRows, listArtisanInvoices } from './apply-extraction';
import type { DraftRow, ExtractedRow } from './apply-extraction';
import { ExtractionPanel } from './extraction-panel';
import { InvoiceList } from './invoice-list';

const OCR_SIM_LATENCY_MS = 800;

export interface InvoiceScanPickerBodyProps {
    artisanId: string;
    onInject: (rows: readonly ExtractedRow[]) => void;
    injectLabel?: string;
}

export function InvoiceScanPickerBody({
    artisanId,
    onInject,
    injectLabel = 'Injecter dans la composition',
}: InvoiceScanPickerBodyProps) {
    const artisanInvoices = useMemo(() => listArtisanInvoices(artisanId), [artisanId]);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [extracting, setExtracting] = useState(false);
    const [rows, setRows] = useState<DraftRow[] | null>(null);

    const selected = useMemo(
        () => artisanInvoices.find((i) => i.id === selectedId) ?? null,
        [artisanInvoices, selectedId],
    );

    useEffect(() => {
        setRows(null);
        setExtracting(false);
    }, [selectedId]);

    const runExtraction = () => {
        if (!selected) return;
        setExtracting(true);
        window.setTimeout(() => {
            setRows(buildInitialRows(selected));
            setExtracting(false);
        }, OCR_SIM_LATENCY_MS);
    };

    const updateRow = (idx: number, patch: Partial<DraftRow>) => {
        setRows((cur) => (cur ? cur.map((r, i) => (i === idx ? { ...r, ...patch } : r)) : cur));
    };
    const removeRow = (idx: number) => setRows((cur) => (cur ? cur.filter((_, i) => i !== idx) : cur));
    const addRow = () =>
        setRows((cur) => [...(cur ?? []), { fiber: 'linen', percentage: 0, supplierId: selected?.supplierId ?? '' }]);

    const inject = () => {
        if (!rows || !selected) return;
        const enriched: ExtractedRow[] = rows.map((r) => ({ ...r, invoiceRef: selected.id }));
        onInject(enriched);
    };

    return (
        <div className="grid gap-4 md:grid-cols-[2fr_3fr]">
            <InvoiceList invoices={artisanInvoices} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} />
            <ExtractionPanel
                selected={selected}
                extracting={extracting}
                rows={rows}
                injectLabel={injectLabel}
                onRunExtraction={runExtraction}
                onAddRow={addRow}
                onUpdateRow={updateRow}
                onRemoveRow={removeRow}
                onInject={inject}
            />
        </div>
    );
}

export interface InvoiceScanPickerProps {
    artisanId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInject: (rows: readonly ExtractedRow[]) => void;
}

export function InvoiceScanPicker({ artisanId, open, onOpenChange, onInject }: InvoiceScanPickerProps) {
    const handleInject = (rows: readonly ExtractedRow[]) => {
        onInject(rows);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Pré-remplir depuis une facture</DialogTitle>
                    <DialogDescription>
                        Sélectionnez une facture fournisseur et lancez l’extraction simulée pour injecter les lignes
                        dans la composition. L’extraction est simulée en mode démo.
                    </DialogDescription>
                </DialogHeader>
                <InvoiceScanPickerBody artisanId={artisanId} onInject={handleInject} injectLabel="Injecter et fermer" />
            </DialogContent>
        </Dialog>
    );
}
