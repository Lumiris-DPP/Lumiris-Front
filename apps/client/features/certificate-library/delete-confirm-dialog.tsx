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
import type { CertificateLibraryItem } from '@lumiris/api-client';

interface Props {
    item: CertificateLibraryItem | null;
    onCancel: () => void;
    onConfirm: () => void;
}

export function DeleteCertificateDialog({ item, onCancel, onConfirm }: Props) {
    return (
        <AlertDialog open={!!item} onOpenChange={(o) => !o && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce certificat ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {item && item.usedOnDppCount > 0
                            ? `Ce certificat est utilisé sur ${item.usedOnDppCount} passeport${item.usedOnDppCount > 1 ? 's' : ''}. Le retirer de la bibliothèque n'affecte pas ces passeports existants, mais vous ne pourrez plus le sélectionner pour de nouveaux passeports.`
                            : 'Ce certificat sera retiré de votre bibliothèque.'}
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
