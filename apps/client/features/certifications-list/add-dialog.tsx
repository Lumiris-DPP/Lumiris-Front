'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@lumiris/ui/components/dialog';
import { toast } from '@lumiris/ui/components/sonner';
import { newCertificateId, useCertificatesStore, type LocalCertificate } from '@/lib/certificates-store';
import { CertificateForm, type CertificateFormValues } from './certificate-form';
import { KIND_LABEL } from './certification-status';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    artisanId: string;
}

export function AddCertificateDialog({ open, onOpenChange, artisanId }: Props) {
    const addCertificate = useCertificatesStore((s) => s.addCertificate);

    function handleSubmit(values: CertificateFormValues) {
        const cert: LocalCertificate = {
            id: newCertificateId(),
            kind: values.kind,
            ...(values.kind === 'CUSTOM' ? { customName: values.customName } : {}),
            issuer: values.issuer,
            scope: values.scope || undefined,
            issuedAt: new Date(values.issuedAt).toISOString(),
            expiresAt: new Date(values.expiresAt).toISOString(),
            verified: false,
            fileUrl: values.fileDataUri || '',
            artisanId,
            fileDataUri: values.fileDataUri || undefined,
            addedAt: new Date().toISOString(),
        };
        addCertificate(cert);
        toast.success('Certificat ajouté', { description: `${KIND_LABEL[values.kind]} — ${values.issuer}` });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Ajouter un certificat</DialogTitle>
                    <DialogDescription>
                        Le certificat reste local tant qu’il n’a pas été vérifié par l’équipe LUMIRIS.
                    </DialogDescription>
                </DialogHeader>
                <CertificateForm submitLabel="Ajouter" onSubmit={handleSubmit} onCancel={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
