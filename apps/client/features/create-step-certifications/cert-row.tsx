'use client';

import { AlertTriangle, FileUp, ShieldAlert, Trash2 } from 'lucide-react';
import { getEffectiveStatus } from '@lumiris/types';
import type { CertificationKind, CertificationRef } from '@lumiris/types';
import { Alert, AlertDescription, AlertTitle } from '@lumiris/ui/components/alert';
import { Button } from '@lumiris/ui/components/button';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { readFileAsDataUrl } from '@lumiris/utils';

const CERT_KINDS: readonly CertificationKind[] = [
    'GOTS',
    'OEKO-TEX',
    'OFG',
    'EPV',
    'GRS',
    'BLUESIGN',
    'ISO-14001',
    'CUSTOM',
];

interface CertRowProps {
    cert: CertificationRef;
    onChange: (patch: Partial<CertificationRef>) => void;
    onRemove: () => void;
}

export function CertRow({ cert, onChange, onRemove }: CertRowProps) {
    const status = getEffectiveStatus(cert, new Date());

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        const dataUrl = await readFileAsDataUrl(file);
        onChange({ fileUrl: dataUrl });
    };

    return (
        <div className="border-border bg-muted/30 space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <p className="text-foreground text-sm font-medium">{cert.kind}</p>
                <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={cert.kind} onValueChange={(v) => onChange({ kind: v as CertificationKind })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CERT_KINDS.map((k) => (
                                <SelectItem key={k} value={k}>
                                    {k}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Organisme</Label>
                    <Input value={cert.issuer} onChange={(e) => onChange({ issuer: e.target.value })} />
                </div>
                {cert.kind === 'CUSTOM' && (
                    <div className="space-y-1.5">
                        <Label>Nom personnalisé</Label>
                        <Input
                            value={cert.customName ?? ''}
                            onChange={(e) => onChange({ customName: e.target.value })}
                        />
                    </div>
                )}
                <div className="space-y-1.5">
                    <Label>Émise le</Label>
                    <Input
                        type="date"
                        value={cert.issuedAt.slice(0, 10)}
                        onChange={(e) => onChange({ issuedAt: new Date(e.target.value).toISOString() })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Expire le</Label>
                    <Input
                        type="date"
                        value={cert.expiresAt.slice(0, 10)}
                        onChange={(e) => onChange({ expiresAt: new Date(e.target.value).toISOString() })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor={`cert-file-${cert.id}`}>Fichier PDF</Label>
                    <label
                        htmlFor={`cert-file-${cert.id}`}
                        className="border-border bg-card text-muted-foreground hover:bg-muted relative flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border text-xs"
                    >
                        <FileUp className="h-3.5 w-3.5" />
                        {cert.fileUrl ? 'Fichier chargé' : 'Importer'}
                        <input
                            id={`cert-file-${cert.id}`}
                            type="file"
                            accept="application/pdf"
                            aria-label="Importer le PDF de la certification"
                            className="absolute inset-0 cursor-pointer opacity-0"
                            onChange={(e) => handleFile(e.target.files?.[0])}
                        />
                    </label>
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
                <Checkbox
                    id={`cert-verified-${cert.id}`}
                    checked={cert.verified}
                    onCheckedChange={(v) => onChange({ verified: Boolean(v) })}
                />
                <Label htmlFor={`cert-verified-${cert.id}`} className="text-foreground font-normal">
                    Vérifié (l’organisme confirme l’authenticité)
                </Label>
            </div>

            {status === 'Expired' && (
                <Alert className="border-lumiris-rose/30 bg-lumiris-rose/5 text-lumiris-rose">
                    <AlertTriangle aria-hidden />
                    <AlertTitle>Certification expirée</AlertTitle>
                    <AlertDescription>
                        Cette certification sera ignorée dans le calcul du score (poids 0).
                    </AlertDescription>
                </Alert>
            )}
            {status === 'Unverified' && (
                <Alert className="border-lumiris-amber/30 bg-lumiris-amber/5 text-lumiris-amber">
                    <ShieldAlert aria-hidden />
                    <AlertTitle>Certification non vérifiée</AlertTitle>
                    <AlertDescription>
                        Tant qu’elle n’est pas vérifiée, elle pèse × 0.5 dans le sous-score Savoir-faire.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
