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
import { CERTIFICATION_KINDS } from '@/lib/certificates-store';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '@/lib/file-upload';
import { zodFieldErrors } from '@/lib/form-errors';
import { useFileUpload } from '@/lib/use-file-upload';
import { KIND_LABEL } from './certification-status';

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

/** The text/select fields of the form; the attached document is managed separately by {@link useFileUpload}. */
type CertificateFields = Omit<CertificateFormValues, 'fileDataUri'>;

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
    const [fields, setFields] = useState<CertificateFields>({
        kind: initial?.kind ?? 'GOTS',
        customName: initial?.customName ?? '',
        issuer: initial?.issuer ?? '',
        scope: initial?.scope ?? '',
        issuedAt: initial?.issuedAt ?? defaultIssued(),
        expiresAt: initial?.expiresAt ?? defaultExpires(),
    });
    const [errors, setErrors] = useState<Partial<Record<keyof CertificateFormValues, string>>>({});
    const file = useFileUpload({
        maxBytes: MAX_UPLOAD_BYTES,
        maxLabel: MAX_UPLOAD_LABEL,
        initialDataUri: initial?.fileDataUri ?? '',
    });

    const setField = <K extends keyof CertificateFields>(key: K, value: CertificateFields[K]) =>
        setFields((f) => ({ ...f, [key]: value }));

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const result = formSchema.safeParse({ ...fields, fileDataUri: file.dataUri });
        if (!result.success) {
            setErrors(zodFieldErrors<CertificateFormValues>(result.error));
            return;
        }
        setErrors({});
        onSubmit(result.data);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="cert-kind">Type</Label>
                <Select
                    value={fields.kind}
                    onValueChange={(v) => setField('kind', v as CertificationKind)}
                    disabled={lockKind}
                >
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

            {fields.kind === 'CUSTOM' ? (
                <div className="grid gap-2">
                    <Label htmlFor="cert-custom">Nom</Label>
                    <Input
                        id="cert-custom"
                        value={fields.customName}
                        onChange={(e) => setField('customName', e.target.value)}
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
                    value={fields.issuer}
                    onChange={(e) => setField('issuer', e.target.value)}
                    placeholder="Ex. Ecocert, AFNOR, OEKO-TEX Standard 100…"
                    aria-invalid={!!errors.issuer}
                />
                {errors.issuer ? <p className="text-destructive text-xs">{errors.issuer}</p> : null}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="cert-scope">Portée</Label>
                <Textarea
                    id="cert-scope"
                    value={fields.scope}
                    onChange={(e) => setField('scope', e.target.value)}
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
                        value={fields.issuedAt}
                        onChange={(e) => setField('issuedAt', e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="cert-expires">Date d’expiration</Label>
                    <Input
                        id="cert-expires"
                        type="date"
                        value={fields.expiresAt}
                        onChange={(e) => setField('expiresAt', e.target.value)}
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
                        file.reading && 'pointer-events-none opacity-60',
                    )}
                >
                    <span className="text-muted-foreground inline-flex items-center gap-2">
                        {file.reading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : file.dataUri ? (
                            <Paperclip className="h-4 w-4" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        <span className="truncate">
                            {file.reading
                                ? 'Lecture…'
                                : file.name ||
                                  (file.dataUri ? 'Document attaché' : `PDF ou image (max ${MAX_UPLOAD_LABEL})`)}
                        </span>
                    </span>
                    <input
                        type="file"
                        accept={ACCEPTED_MIME}
                        className="hidden"
                        aria-label={`Document du certificat (PDF ou image, max ${MAX_UPLOAD_LABEL})`}
                        onChange={file.onChange}
                    />
                </label>
                {file.error ? <p className="text-destructive text-xs">{file.error}</p> : null}
            </div>

            <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Annuler
                </Button>
                <Button type="submit" disabled={file.reading}>
                    {submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
}
