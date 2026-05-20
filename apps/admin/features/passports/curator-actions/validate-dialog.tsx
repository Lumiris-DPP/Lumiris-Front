'use client';

import type { AdminAuditLogEntry, Passport, IrisGrade as IrisGradeLetter } from '@lumiris/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@lumiris/ui/components/alert-dialog';
import { useLogAction } from '@/lib/auth';
import { useCurationStore } from '../curation-store';

interface ValidateDialogProps {
    passport: Passport;
    grade: IrisGradeLetter;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAfterAction: (entry: AdminAuditLogEntry) => void;
}

export function ValidateDialog({ passport, grade, open, onOpenChange, onAfterAction }: ValidateDialogProps) {
    const log = useLogAction();
    const { setOverlay } = useCurationStore();

    const handleValidate = () => {
        const publishedAt = new Date().toISOString();
        setOverlay(passport.id, { status: 'validated', publishedAt });
        // Approbation finale (validated + publication QR) → `passport.validate` ; `passport.curate` est réservé aux étapes en amont.
        const entry = log({
            action: 'passport.validate',
            targetType: 'passport',
            targetId: passport.id,
            payload: {
                decision: 'validated',
                publishedAt,
                qrCodeUrl: passport.gs1.verificationUrl,
                artisanId: passport.artisanId,
            },
        });
        onOpenChange(false);
        onAfterAction(entry);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Valider et publier ce passeport ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le passeport <strong>{passport.garment.reference}</strong> sera publié avec son grade Iris{' '}
                        <strong>{grade}</strong>. Le QR code GS1 sera émis. Action tracée dans le log de gouvernance.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleValidate}
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90"
                    >
                        Confirmer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
