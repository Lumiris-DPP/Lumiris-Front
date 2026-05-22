'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@lumiris/ui/components/dialog';
import { toast } from '@lumiris/ui/components/sonner';
import {
    newCertificateId,
    useCertificatesStore,
    type ArtisanCertificate,
    type LocalCertificate,
} from '@/lib/certificates-store';
import { CertificateForm, type CertificateFormValues } from './certificate-form';
import { KIND_LABEL } from './certification-status';

interface RenewCertificateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cert: ArtisanCertificate | null;
}

export function RenewCertificateDialog({ open, onOpenChange, cert }: RenewCertificateDialogProps) {
    const addCertificate = useCertificatesStore((s) => s.addCertificate);
    const markExpired = useCertificatesStore((s) => s.markExpired);

    if (!cert) return null;

    function handleSubmit(values: CertificateFormValues) {
        if (!cert) return;
        const renewed: LocalCertificate = {
            id: newCertificateId(),
            kind: values.kind,
            ...(values.kind === 'CUSTOM' ? { customName: values.customName } : {}),
            issuer: values.issuer,
            scope: values.scope || undefined,
            issuedAt: new Date(values.issuedAt).toISOString(),
            expiresAt: new Date(values.expiresAt).toISOString(),
            verified: false,
            fileUrl: values.fileDataUri || '',
            artisanId: cert.artisanId,
            fileDataUri: values.fileDataUri || undefined,
            addedAt: new Date().toISOString(),
        };
        addCertificate(renewed);
        markExpired(cert.id);
        toast.success('Certificat renouvelé', {
            description: `${KIND_LABEL[values.kind]} — ${values.issuer}. L’ancien est marqué comme expiré.`,
        });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Renouveler le certificat</DialogTitle>
                    <DialogDescription>
                        L’ancien certificat sera basculé en « Expiré » et conservé pour traçabilité.
                    </DialogDescription>
                </DialogHeader>
                <CertificateForm
                    initial={{
                        kind: cert.kind,
                        customName: cert.customName ?? '',
                        issuer: cert.issuer,
                        scope: cert.scope ?? '',
                    }}
                    submitLabel="Renouveler"
                    lockKind
                    onSubmit={handleSubmit}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
