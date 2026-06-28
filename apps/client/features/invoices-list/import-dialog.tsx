'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { mockSuppliers } from '@lumiris/mock-data';
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
import { toast } from '@lumiris/ui/components/sonner';
import { formatBytes, readFileAsDataUrl } from '@lumiris/utils';
import { type InvoiceFiberLine, type LocalInvoice, useInvoicesStore } from '@/lib/invoices-store';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, isImageMime } from '@/lib/file-upload';
import { genFibers, makeRng, seedHash } from './extraction-utils';
import { ImportFilePicker, type PickedFile } from './import-file-picker';
import { ImportMetadataForm, type MetadataErrors } from './import-metadata-form';

const ACCEPT = 'image/*,application/pdf';
const todayIso = new Date().toISOString().slice(0, 10);

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

interface ImportState {
    file: PickedFile | null;
    dragActive: boolean;
    fileError: string | null;
    hasExtracted: boolean;
    supplierId: string;
    issuedAt: string;
    totalAmount: number;
    fibers: InvoiceFiberLine[];
    notes: string;
    errors: MetadataErrors;
}

const INITIAL_STATE: ImportState = {
    file: null,
    dragActive: false,
    fileError: null,
    hasExtracted: false,
    supplierId: '',
    issuedAt: todayIso,
    totalAmount: 0,
    fibers: [],
    notes: '',
    errors: {},
};

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    artisanId: string;
}

export function ImportInvoiceDialog({ open, onOpenChange, artisanId }: Props) {
    const addInvoice = useInvoicesStore((s) => s.addInvoice);

    const [state, setState] = useState<ImportState>(INITIAL_STATE);
    const patch = (next: Partial<ImportState>) => setState((s) => ({ ...s, ...next }));

    // Reset everything when the dialog closes.
    useEffect(() => {
        if (!open) setState(INITIAL_STATE);
    }, [open]);

    const handleFiles = async (list: FileList | null) => {
        const f = list?.[0];
        if (!f) return;
        if (f.size > MAX_UPLOAD_BYTES) {
            patch({ fileError: `Fichier trop volumineux (${formatBytes(f.size)}). Limite : ${MAX_UPLOAD_LABEL}.` });
            return;
        }
        if (!isImageMime(f.type) && f.type !== 'application/pdf') {
            patch({ fileError: 'Format non supporté. Acceptés : PDF, JPG, PNG.' });
            return;
        }
        const dataUri = await readFileAsDataUrl(f);
        patch({ fileError: null, file: { name: f.name, type: f.type, dataUri, size: f.size } });
    };

    const runExtraction = () => {
        if (!state.file) return;
        const rng = makeRng(seedHash(`${state.file.name}|${state.file.size}|${Date.now()}`));
        const supplier = mockSuppliers[Math.floor(rng() * mockSuppliers.length)] ?? mockSuppliers[0];
        if (!supplier) return;
        patch({
            supplierId: supplier.id,
            fibers: genFibers(supplier.fibers, rng),
            totalAmount: Math.round((300 + rng() * 4700) * 100) / 100,
            hasExtracted: true,
        });
    };

    const onSubmit = () => {
        const { file, supplierId, issuedAt, totalAmount, notes, hasExtracted, fibers } = state;
        if (!file) {
            patch({ fileError: 'Importez une facture avant de valider.' });
            return;
        }
        const parsed = FormSchema.safeParse({ supplierId, issuedAt, totalAmount, notes: notes || undefined });
        if (!parsed.success) {
            const next: MetadataErrors = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as keyof MetadataErrors | undefined;
                if (key && !next[key]) next[key] = issue.message;
            }
            patch({ errors: next });
            return;
        }
        const local: LocalInvoice = {
            id: crypto.randomUUID(),
            artisanId,
            fileDataUri: file.dataUri,
            supplierId: parsed.data.supplierId,
            issuedAt: parsed.data.issuedAt,
            totalAmount: parsed.data.totalAmount,
            notes: parsed.data.notes,
            extraction: { status: hasExtracted ? 'extracted' : 'pending', fibers },
            addedAt: new Date().toISOString(),
        };
        addInvoice(local);
        toast.success('Facture importée', {
            description: hasExtracted ? 'Fibres pré-remplies depuis l’extraction.' : 'À traiter manuellement.',
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Importer une facture fournisseur</DialogTitle>
                    <DialogDescription>PDF ou image (max {MAX_UPLOAD_LABEL}).</DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <ImportFilePicker
                        file={state.file}
                        dragActive={state.dragActive}
                        onDragActiveChange={(v) => patch({ dragActive: v })}
                        onFiles={(l) => void handleFiles(l)}
                        onClear={() => patch({ file: null })}
                        accept={ACCEPT}
                    />
                    {state.fileError ? (
                        <Alert variant="destructive">
                            <AlertDescription>{state.fileError}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="flex items-center justify-end">
                        <Button onClick={runExtraction} disabled={!state.file} variant="outline" size="sm">
                            {state.hasExtracted ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5" />
                            ) : (
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {state.hasExtracted ? 'Re-simuler' : 'Simuler l’extraction'}
                        </Button>
                    </div>

                    <ImportMetadataForm
                        supplierId={state.supplierId}
                        onSupplierId={(v) => patch({ supplierId: v })}
                        issuedAt={state.issuedAt}
                        onIssuedAt={(v) => patch({ issuedAt: v })}
                        totalAmount={state.totalAmount}
                        onTotalAmount={(v) => patch({ totalAmount: v })}
                        fibers={state.fibers}
                        onFibers={(v) => patch({ fibers: v })}
                        notes={state.notes}
                        onNotes={(v) => patch({ notes: v })}
                        errors={state.errors}
                    />
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={onSubmit} disabled={!state.file}>
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
