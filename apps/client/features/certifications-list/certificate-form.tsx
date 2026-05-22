'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Paperclip, Upload } from 'lucide-react';
import { z } from 'zod';
import type { CertificationKind } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { DialogFooter } from '@lumiris/ui/components/dialog';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { readFileAsDataUrl } from '@lumiris/utils';
import { CERTIFICATION_KINDS } from '@/lib/certificates-store';
import { KIND_LABEL } from './certification-status';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME = 'application/pdf,image/png,image/jpeg,image/webp';
const KIND_TUPLE = [...CERTIFICATION_KINDS] as [CertificationKind, ...CertificationKind[]];

export interface CertificateFormValues {
    kind: CertificationKind;
    customName: string;
    issuer: string;
    scope: string;
    issuedAt: string;
    expiresAt: string;
    fileDataUri: string;
}

const formSchema = z
    .object({
        kind: z.enum(KIND_TUPLE),
        customName: z.string().trim(),
        issuer: z.string().trim().min(1, 'Émetteur obligatoire'),
        scope: z.string().trim(),
        issuedAt: z.string().min(1, 'Date d’émission obligatoire'),
        expiresAt: z.string().min(1, 'Date d’expiration obligatoire'),
        fileDataUri: z.string(),
    })
    .refine((v) => v.kind !== 'CUSTOM' || v.customName.length > 0, {
        path: ['customName'],
        message: 'Nom obligatoire pour un certificat personnalisé',
    })
    .refine((v) => new Date(v.expiresAt).getTime() > new Date(v.issuedAt).getTime(), {
        path: ['expiresAt'],
        message: 'Doit être postérieure à la date d’émission',
    });

function defaultIssued(): string {
    return new Date().toISOString().slice(0, 10);
}

function defaultExpires(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    return d.toISOString().slice(0, 10);
}

interface Props {
    initial?: Partial<CertificateFormValues>;
    submitLabel: string;
    onSubmit: (values: CertificateFormValues) => void;
    onCancel: () => void;
    lockKind?: boolean;
}

export function CertificateForm({ initial, submitLabel, onSubmit, onCancel, lockKind }: Props) {
    const [kind, setKind] = useState<CertificationKind>(initial?.kind ?? 'GOTS');
    const [customName, setCustomName] = useState(initial?.customName ?? '');
    const [issuer, setIssuer] = useState(initial?.issuer ?? '');
    const [scope, setScope] = useState(initial?.scope ?? '');
    const [issuedAt, setIssuedAt] = useState(initial?.issuedAt ?? defaultIssued());
    const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ?? defaultExpires());
    const [fileDataUri, setFileDataUri] = useState(initial?.fileDataUri ?? '');
    const [fileName, setFileName] = useState('');
    const [fileError, setFileError] = useState('');
    const [reading, setReading] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof CertificateFormValues, string>>>({});

    async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            setFileError('Fichier trop volumineux (5 Mo max).');
            return;
        }
        setFileError('');
        setReading(true);
        try {
            const dataUri = await readFileAsDataUrl(file);
            setFileDataUri(dataUri);
            setFileName(file.name);
        } catch {
            setFileError('Impossible de lire le fichier.');
        } finally {
            setReading(false);
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const result = formSchema.safeParse({ kind, customName, issuer, scope, issuedAt, expiresAt, fileDataUri });
        if (!result.success) {
            const flat = result.error.flatten().fieldErrors;
            setErrors({
                customName: flat.customName?.[0],
                issuer: flat.issuer?.[0],
                issuedAt: flat.issuedAt?.[0],
                expiresAt: flat.expiresAt?.[0],
            });
            return;
        }
        setErrors({});
        onSubmit(result.data);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="cert-kind">Type</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as CertificationKind)} disabled={lockKind}>
                    <SelectTrigger id="cert-kind" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {CERTIFICATION_KINDS.map((k) => (
                            <SelectItem key={k} value={k}>
                                {KIND_LABEL[k]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {kind === 'CUSTOM' ? (
                <div className="grid gap-2">
                    <Label htmlFor="cert-custom">Nom</Label>
                    <Input
                        id="cert-custom"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Ex. Maître Brodeur des Compagnons"
                        aria-invalid={!!errors.customName}
                    />
                    {errors.customName ? <p className="text-destructive text-xs">{errors.customName}</p> : null}
                </div>
            ) : null}

            <div className="grid gap-2">
                <Label htmlFor="cert-issuer">Émetteur</Label>
                <Input
                    id="cert-issuer"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder="Ex. Ecocert, AFNOR, OEKO-TEX Standard 100…"
                    aria-invalid={!!errors.issuer}
                />
                {errors.issuer ? <p className="text-destructive text-xs">{errors.issuer}</p> : null}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="cert-scope">Portée</Label>
                <Textarea
                    id="cert-scope"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    placeholder="Ex. Lin breton — filature de Quimper"
                    rows={2}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label htmlFor="cert-issued">Date d’émission</Label>
                    <Input
                        id="cert-issued"
                        type="date"
                        value={issuedAt}
                        onChange={(e) => setIssuedAt(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="cert-expires">Date d’expiration</Label>
                    <Input
                        id="cert-expires"
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        aria-invalid={!!errors.expiresAt}
                    />
                    {errors.expiresAt ? <p className="text-destructive text-xs">{errors.expiresAt}</p> : null}
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Document</Label>
                <label
                    className={cn(
                        'border-input bg-background hover:bg-accent/50 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed px-3 py-2.5 text-sm transition',
                        reading && 'pointer-events-none opacity-60',
                    )}
                >
                    <span className="text-muted-foreground inline-flex items-center gap-2">
                        {reading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : fileDataUri ? (
                            <Paperclip className="h-4 w-4" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        <span className="truncate">
                            {reading
                                ? 'Lecture…'
                                : fileName || (fileDataUri ? 'Document attaché' : 'PDF ou image (max 5 Mo)')}
                        </span>
                    </span>
                    <input
                        type="file"
                        accept={ACCEPTED_MIME}
                        className="hidden"
                        aria-label="Document du certificat (PDF ou image, max 5 Mo)"
                        onChange={onFileChange}
                    />
                </label>
                {fileError ? <p className="text-destructive text-xs">{fileError}</p> : null}
            </div>

            <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Annuler
                </Button>
                <Button type="submit" disabled={reading}>
                    {submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
}
