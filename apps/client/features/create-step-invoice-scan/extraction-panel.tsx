'use client';

import Image from 'next/image';
import { CheckCircle2, FileText, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { Fiber, SupplierInvoice } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { mockSuppliers } from '@lumiris/mock-data';
import { FIBER_OPTIONS, supplierLabel } from './picker-shared';
import type { DraftRow } from './apply-extraction';

interface ExtractionPanelProps {
    selected: SupplierInvoice | null;
    extracting: boolean;
    rows: DraftRow[] | null;
    injectLabel: string;
    onRunExtraction: () => void;
    onAddRow: () => void;
    onUpdateRow: (idx: number, patch: Partial<DraftRow>) => void;
    onRemoveRow: (idx: number) => void;
    onInject: () => void;
}

export function ExtractionPanel({
    selected,
    extracting,
    rows,
    injectLabel,
    onRunExtraction,
    onAddRow,
    onUpdateRow,
    onRemoveRow,
    onInject,
}: ExtractionPanelProps) {
    if (!selected) {
        return (
            <div className="border-border bg-muted/20 text-muted-foreground min-h-70 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm">
                <FileText className="h-6 w-6" />
                <p>Sélectionnez une facture à gauche pour démarrer l’extraction.</p>
            </div>
        );
    }

    const hasDataUri = selected.fileUrl.startsWith('data:image/');
    const ocr = selected.ocrExtracted;
    const totalPct = (rows ?? []).reduce((s, r) => s + (Number(r.percentage) || 0), 0);

    return (
        <div className="border-border bg-card space-y-4 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-foreground text-sm font-medium">
                        {ocr?.supplierName ?? supplierLabel(selected.supplierId)}
                    </p>
                    <p className="text-muted-foreground font-mono text-[11px]">{selected.id}</p>
                </div>
                {ocr && (
                    <p className="text-muted-foreground text-[11px]">
                        Total HT{' '}
                        <span className="text-foreground font-mono">
                            {ocr.totalHt.toLocaleString('fr-FR')} {ocr.currency}
                        </span>
                    </p>
                )}
            </div>

            {hasDataUri && (
                <div className="border-border relative h-40 overflow-hidden rounded-md border">
                    <Image
                        src={selected.fileUrl}
                        alt={`Aperçu facture ${selected.id}`}
                        fill
                        unoptimized
                        sizes="(min-width: 768px) 60vw, 100vw"
                        className="object-cover"
                    />
                </div>
            )}

            {rows === null ? (
                <div className="flex flex-col items-start gap-2">
                    <Button onClick={onRunExtraction} disabled={extracting}>
                        {extracting ? (
                            <>
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Extraction…
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-1.5 h-4 w-4" /> Simuler l’extraction
                            </>
                        )}
                    </Button>
                    <p className="text-muted-foreground text-[11px]">
                        L’extraction simulée pré-remplit la table fibres × % × fournisseur que vous pourrez ajuster.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-foreground flex items-center gap-1.5 text-xs font-medium">
                            <CheckCircle2 className="text-lumiris-emerald h-3.5 w-3.5" />
                            {rows.length} ligne{rows.length > 1 ? 's' : ''} extraite{rows.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-muted-foreground font-mono text-[11px]">somme {totalPct.toFixed(0)} %</p>
                    </div>
                    <div className="space-y-2">
                        {rows.map((row, idx) => (
                            <ExtractionRow
                                key={idx}
                                row={row}
                                onChange={(patch) => onUpdateRow(idx, patch)}
                                onRemove={() => onRemoveRow(idx)}
                            />
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={onAddRow}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Ajouter une ligne
                    </Button>
                    <Button
                        onClick={onInject}
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 w-full text-white"
                    >
                        {injectLabel}
                    </Button>
                </div>
            )}
        </div>
    );
}

function ExtractionRow({
    row,
    onChange,
    onRemove,
}: {
    row: DraftRow;
    onChange: (patch: Partial<DraftRow>) => void;
    onRemove: () => void;
}) {
    return (
        <div className="bg-muted/30 grid gap-2 rounded-md p-2 sm:grid-cols-[1.5fr_80px_1.5fr_auto]">
            <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Fibre</Label>
                <Select value={row.fiber} onValueChange={(v) => onChange({ fiber: v as Fiber })}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FIBER_OPTIONS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                                {f.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">%</Label>
                <Input
                    type="number"
                    min={0}
                    max={100}
                    value={row.percentage || ''}
                    onChange={(e) => onChange({ percentage: Number(e.target.value) || 0 })}
                />
            </div>
            <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Fournisseur</Label>
                <Select
                    value={row.supplierId || '__none'}
                    onValueChange={(v) => onChange({ supplierId: v === '__none' ? '' : v })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none">- Aucun</SelectItem>
                        {mockSuppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-end justify-end">
                <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Supprimer la ligne">
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
