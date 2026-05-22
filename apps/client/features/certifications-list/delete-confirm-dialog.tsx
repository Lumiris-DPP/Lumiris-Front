'use client';

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
import type { ArtisanCertificate } from '@/lib/certificates-store';

interface Props {
    cert: ArtisanCertificate | null;
    onCancel: () => void;
    onConfirm: () => void;
}

export function DeleteCertificateDialog({ cert, onCancel, onConfirm }: Props) {
    return (
        <AlertDialog open={!!cert} onOpenChange={(o) => !o && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce certificat ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est définitive — le certificat local sera retiré de votre atelier.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
