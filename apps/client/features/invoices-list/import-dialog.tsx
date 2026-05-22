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
import { readFileAsDataUrl } from '@lumiris/utils';
import { type InvoiceFiberLine, type LocalInvoice, useInvoicesStore } from '@/lib/invoices-store';
import { formatBytes } from '@/lib/list-helpers';
import { genFibers, makeRng, seedHash } from './extraction-utils';
import { ImportFilePicker, type PickedFile } from './import-file-picker';
import { ImportMetadataForm, type MetadataErrors } from './import-metadata-form';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/*,application/pdf';

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

    const [file, setFile] = useState<PickedFile | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [hasExtracted, setHasExtracted] = useState(false);
    const [supplierId, setSupplierId] = useState('');
    const [issuedAt, setIssuedAt] = useState(todayIso);
    const [totalAmount, setTotalAmount] = useState(0);
    const [fibers, setFibers] = useState<InvoiceFiberLine[]>([]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<MetadataErrors>({});

    useEffect(() => {
        if (open) return;
        setFile(null);
        setDragActive(false);
        setFileError(null);
        setHasExtracted(false);
        setSupplierId('');
        setIssuedAt(todayIso);
        setTotalAmount(0);
        setFibers([]);
        setNotes('');
        setErrors({});
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
        setFile({ name: f.name, type: f.type, dataUri, size: f.size });
    };

    const runExtraction = () => {
        if (!file) return;
        const rng = makeRng(seedHash(`${file.name}|${file.size}|${Date.now()}`));
        const supplier = mockSuppliers[Math.floor(rng() * mockSuppliers.length)] ?? mockSuppliers[0];
        if (!supplier) return;
        setSupplierId(supplier.id);
        setFibers(genFibers(supplier.fibers, rng));
        setTotalAmount(Math.round((300 + rng() * 4700) * 100) / 100);
        setHasExtracted(true);
    };

    const onSubmit = () => {
        if (!file) {
            setFileError('Importez une facture avant de valider.');
            return;
        }
        const parsed = FormSchema.safeParse({ supplierId, issuedAt, totalAmount, notes: notes || undefined });
        if (!parsed.success) {
            const next: MetadataErrors = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as keyof MetadataErrors | undefined;
                if (key && !next[key]) next[key] = issue.message;
            }
            setErrors(next);
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
                    <DialogDescription>PDF ou image (max 5 MB).</DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <ImportFilePicker
                        file={file}
                        dragActive={dragActive}
                        onDragActiveChange={setDragActive}
                        onFiles={(l) => void handleFiles(l)}
                        onClear={() => setFile(null)}
                        accept={ACCEPT}
                    />
                    {fileError ? (
                        <Alert variant="destructive">
                            <AlertDescription>{fileError}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="flex items-center justify-end">
                        <Button onClick={runExtraction} disabled={!file} variant="outline" size="sm">
                            {hasExtracted ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5" />
                            ) : (
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {hasExtracted ? 'Re-simuler' : 'Simuler l’extraction'}
                        </Button>
                    </div>

                    <ImportMetadataForm
                        supplierId={supplierId}
                        onSupplierId={setSupplierId}
                        issuedAt={issuedAt}
                        onIssuedAt={setIssuedAt}
                        totalAmount={totalAmount}
                        onTotalAmount={setTotalAmount}
                        fibers={fibers}
                        onFibers={setFibers}
                        notes={notes}
                        onNotes={setNotes}
                        errors={errors}
                    />
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

const todayIso = new Date().toISOString().slice(0, 10);
