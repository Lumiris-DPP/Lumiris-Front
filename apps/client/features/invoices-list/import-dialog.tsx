'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FileText, Loader2, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { z } from 'zod';
import type { Fiber } from '@lumiris/types';
import { Alert, AlertDescription } from '@lumiris/ui/components/alert';
import { Button } from '@lumiris/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { toast } from '@lumiris/ui/components/sonner';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { mockSuppliers } from '@lumiris/mock-data';
import { readFileAsDataUrl } from '@lumiris/utils';
import { type InvoiceFiberLine, type LocalInvoice, useInvoicesStore } from '@/lib/invoices-store';

const MAX_BYTES = 5 * 1024 * 1024;
const WARN_BYTES = 1 * 1024 * 1024;
const ACCEPT = 'image/*,application/pdf';
const SIM_LATENCY_MS = 800;

const FormSchema = z
    .object({
        supplierId: z.string().min(1, 'Sélectionnez un fournisseur.'),
        issuedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide.'),
        totalAmount: z.number({ invalid_type_error: 'Montant invalide.' }).min(0, 'Le montant doit être ≥ 0.'),
        notes: z.string().max(500).optional(),
    })
    .refine((d) => new Date(d.issuedAt).getTime() <= Date.now() + 24 * 3600_000, {
        message: 'La date ne peut pas être dans le futur.',
        path: ['issuedAt'],
    });

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    artisanId: string;
}

export function ImportInvoiceDialog({ open, onOpenChange, artisanId }: Props) {
    const addInvoice = useInvoicesStore((s) => s.addInvoice);

    const [file, setFile] = useState<{ name: string; type: string; dataUri: string; size: number } | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [extracting, setExtracting] = useState(false);
    const [hasExtracted, setHasExtracted] = useState(false);

    const [supplierId, setSupplierId] = useState('');
    const [issuedAt, setIssuedAt] = useState(today());
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [fibers, setFibers] = useState<InvoiceFiberLine[]>([]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Partial<Record<'supplierId' | 'issuedAt' | 'totalAmount' | 'notes', string>>>(
        {},
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputId = useId();

    useEffect(() => {
        if (!open) {
            setFile(null);
            setDragActive(false);
            setFileError(null);
            setExtracting(false);
            setHasExtracted(false);
            setSupplierId('');
            setIssuedAt(today());
            setTotalAmount(0);
            setFibers([]);
            setNotes('');
            setErrors({});
        }
    }, [open]);

    const handleFiles = async (list: FileList | null) => {
        const f = list?.[0];
        if (!f) return;
        if (f.size > MAX_BYTES) {
            setFileError(`Fichier trop volumineux (${formatBytes(f.size)}). Limite : 5 MB.`);
            return;
        }
        if (!/^image\//.test(f.type) && f.type !== 'application/pdf') {
            setFileError('Format non supporté. Acceptés : PDF, JPG, PNG.');
            return;
        }
        setFileError(null);
        const dataUri = await readFileAsDataUrl(f);
        if (dataUri.length > WARN_BYTES) {
            console.warn(
                `[invoices] data URI ~${formatBytes(dataUri.length)} pour ${f.name} — proche du quota localStorage.`,
            );
        }
        setFile({ name: f.name, type: f.type, dataUri, size: f.size });
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        void handleFiles(e.dataTransfer.files);
    };

    const runExtraction = () => {
        if (!file) return;
        setExtracting(true);
        window.setTimeout(() => {
            const seed = `${file.name}|${file.size}|${Date.now()}`;
            const rng = makeRng(seedHash(seed));
            const supplier = mockSuppliers[Math.floor(rng() * mockSuppliers.length)] ?? mockSuppliers[0];
            if (!supplier) {
                setExtracting(false);
                return;
            }
            const generatedFibers = genFibers(supplier.fibers, rng);
            const generatedAmount = Math.round((300 + rng() * 4700) * 100) / 100;
            setSupplierId(supplier.id);
            setFibers(generatedFibers);
            setTotalAmount(generatedAmount);
            setExtracting(false);
            setHasExtracted(true);
        }, SIM_LATENCY_MS);
    };

    const onSubmit = () => {
        if (!file) {
            setFileError('Importez une facture avant de valider.');
            return;
        }
        const parsed = FormSchema.safeParse({ supplierId, issuedAt, totalAmount, notes: notes || undefined });
        if (!parsed.success) {
            const next: typeof errors = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as keyof typeof errors | undefined;
                if (key && !next[key]) next[key] = issue.message;
            }
            setErrors(next);
            return;
        }
        const now = new Date().toISOString();
        const local: LocalInvoice = {
            id: crypto.randomUUID(),
            artisanId,
            fileDataUri: file.dataUri,
            supplierId: parsed.data.supplierId,
            issuedAt: parsed.data.issuedAt,
            totalAmount: parsed.data.totalAmount,
            notes: parsed.data.notes,
            extraction: {
                status: hasExtracted ? 'extracted' : 'pending',
                fibers,
            },
            addedAt: now,
        };
        addInvoice(local);
        toast.success('Facture importée', {
            description: hasExtracted ? 'Extraction simulée et fibres pré-remplies.' : 'À traiter manuellement.',
        });
        onOpenChange(false);
    };

    const isImage = file?.type.startsWith('image/');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Importer une facture fournisseur</DialogTitle>
                    <DialogDescription>
                        PDF ou image (max 5 MB). L&apos;extraction est simulée localement — aucune donnée envoyée.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {!file ? (
                        <label
                            htmlFor={fileInputId}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragActive(true);
                            }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={onDrop}
                            className={cn(
                                'border-border bg-muted/40 hover:bg-muted relative flex h-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors',
                                dragActive && 'border-lumiris-emerald bg-lumiris-emerald/5',
                            )}
                        >
                            <Upload className="text-muted-foreground h-6 w-6" />
                            <p className="text-foreground text-sm font-medium">Glissez une facture ou cliquez ici</p>
                            <p className="text-muted-foreground text-xs">PDF · JPG · PNG · 5 MB max</p>
                            <Input
                                id={fileInputId}
                                ref={inputRef}
                                type="file"
                                accept={ACCEPT}
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={(e) => void handleFiles(e.target.files)}
                            />
                        </label>
                    ) : (
                        <div className="border-border bg-card flex items-center gap-3 rounded-lg border p-3">
                            {isImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={file.dataUri}
                                    alt={file.name}
                                    className="border-border h-16 w-16 rounded-md border object-cover"
                                />
                            ) : (
                                <div className="border-border bg-muted flex h-16 w-16 items-center justify-center rounded-md border">
                                    <FileText className="text-muted-foreground h-7 w-7" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-foreground truncate text-sm font-medium">{file.name}</p>
                                <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Retirer">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    {fileError && (
                        <Alert variant="destructive">
                            <AlertDescription>{fileError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex items-center justify-between gap-3">
                        <p className="text-muted-foreground text-xs">
                            {hasExtracted
                                ? 'Champs pré-remplis depuis l’extraction simulée.'
                                : 'Pas d’OCR réel — un clic remplit les champs avec un set plausible.'}
                        </p>
                        <Button onClick={runExtraction} disabled={!file || extracting} variant="outline" size="sm">
                            {extracting ? (
                                <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Extraction…
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />{' '}
                                    {hasExtracted ? 'Re-simuler' : 'Simuler l’extraction'}
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label htmlFor="inv-supplier">Fournisseur *</Label>
                            <Select value={supplierId} onValueChange={setSupplierId}>
                                <SelectTrigger id="inv-supplier" className="w-full">
                                    <SelectValue placeholder="Choisir un fournisseur" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockSuppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name} · {s.country}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.supplierId && <p className="text-destructive mt-1 text-xs">{errors.supplierId}</p>}
                        </div>

                        <div>
                            <Label htmlFor="inv-date">Date d&apos;émission *</Label>
                            <Input
                                id="inv-date"
                                type="date"
                                value={issuedAt}
                                onChange={(e) => setIssuedAt(e.target.value)}
                            />
                            {errors.issuedAt && <p className="text-destructive mt-1 text-xs">{errors.issuedAt}</p>}
                        </div>

                        <div>
                            <Label htmlFor="inv-amount">Total HT (EUR) *</Label>
                            <Input
                                id="inv-amount"
                                type="number"
                                min={0}
                                step="0.01"
                                value={Number.isFinite(totalAmount) ? totalAmount : ''}
                                onChange={(e) => setTotalAmount(Number(e.target.value))}
                            />
                            {errors.totalAmount && (
                                <p className="text-destructive mt-1 text-xs">{errors.totalAmount}</p>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <Label>Fibres détectées</Label>
                            {fibers.length === 0 ? (
                                <p className="text-muted-foreground border-border bg-muted/30 mt-1 rounded-md border p-3 text-xs">
                                    Aucune fibre détectée. Lancez l&apos;extraction pour pré-remplir.
                                </p>
                            ) : (
                                <ul className="border-border bg-card mt-1 divide-y rounded-md border">
                                    {fibers.map((f, i) => (
                                        <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                                            <span className="text-foreground capitalize">{f.fiber}</span>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={f.pct}
                                                    onChange={(e) =>
                                                        setFibers((prev) =>
                                                            prev.map((row, idx) =>
                                                                idx === i
                                                                    ? { ...row, pct: Number(e.target.value) }
                                                                    : row,
                                                            ),
                                                        )
                                                    }
                                                    className="h-8 w-20"
                                                />
                                                <span className="text-muted-foreground text-xs">%</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setFibers((prev) => prev.filter((_, idx) => idx !== i))
                                                    }
                                                    aria-label="Retirer la fibre"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="inv-notes">Notes</Label>
                            <Textarea
                                id="inv-notes"
                                placeholder="Référence interne, lot, particularités…"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={onSubmit} disabled={!file}>
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function today(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function seedHash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h >>> 0 || 1;
}

function makeRng(seed: number): () => number {
    let state = seed;
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}

export function genFibers(supplierFibers: readonly string[], rng: () => number): InvoiceFiberLine[] {
    if (supplierFibers.length === 0) return [];
    if (supplierFibers.length === 1) return [{ fiber: supplierFibers[0] as Fiber, pct: 100 }];
    const weights = supplierFibers.map(() => rng() * 0.8 + 0.2);
    const sum = weights.reduce((a, b) => a + b, 0);
    const lines = supplierFibers.map((f, i) => ({
        fiber: f as Fiber,
        pct: Math.round(((weights[i] ?? 0) / sum) * 100),
    }));
    const drift = 100 - lines.reduce((a, l) => a + l.pct, 0);
    if (drift !== 0 && lines[0]) lines[0] = { ...lines[0], pct: lines[0].pct + drift };
    return lines;
}
