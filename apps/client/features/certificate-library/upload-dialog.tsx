'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lumiris/ui/components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@lumiris/ui/components/dialog';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { toast } from '@lumiris/ui/components/sonner';
import { isApiError, useUploadCertificate } from '@lumiris/api-client/react';
import type { CertificateLibraryType } from '@lumiris/api-client';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TYPE_LABEL: Record<CertificateLibraryType, string> = {
    ORIGIN: "Certificat d'origine géographique",
    TRANSACTION: 'Certificat de transaction',
};

export function UploadCertificateDialog({ open, onOpenChange }: Props) {
    const [type, setType] = useState<CertificateLibraryType>('ORIGIN');
    const [file, setFile] = useState<File | null>(null);
    const uploadCertificate = useUploadCertificate();

    // Réinitialise après la fermeture (effet, pas en cascade dans le callback qui ferme la
    // modale) — enchaîner un setState local juste après avoir fait passer `open` à false
    // pouvait entrer en conflit avec l'animation de sortie interne de Radix Dialog.
    useEffect(() => {
        if (!open) {
            setType('ORIGIN');
            setFile(null);
        }
    }, [open]);

    function handleSubmit() {
        if (!file) return;
        uploadCertificate.mutate(
            { file, type },
            {
                onSuccess: () => {
                    toast.success('Certificat ajouté', { description: file.name });
                    onOpenChange(false);
                },
                onError: (err) =>
                    toast.error('Échec de l’ajout', { description: isApiError(err) ? err.message : undefined }),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Ajouter un certificat</DialogTitle>
                    <DialogDescription>
                        Ce certificat pourra ensuite être rattaché à plusieurs passeports depuis le formulaire DPP.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cert-type">Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v as CertificateLibraryType)}>
                            <SelectTrigger id="cert-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ORIGIN">{TYPE_LABEL.ORIGIN}</SelectItem>
                                <SelectItem value="TRANSACTION">{TYPE_LABEL.TRANSACTION}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cert-file">Fichier</Label>
                        <input
                            id="cert-file"
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={!file || uploadCertificate.isPending}>
                        Ajouter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
