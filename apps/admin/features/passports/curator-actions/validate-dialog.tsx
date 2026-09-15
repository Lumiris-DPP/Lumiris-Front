'use client';

import type { Passport, IrisGrade as IrisGradeLetter } from '@lumiris/types';
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
import { useCurationStore } from '../curation-store';

interface ValidateDialogProps {
    passport: Passport;
    grade: IrisGradeLetter;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ValidateDialog({ passport, grade, open, onOpenChange }: ValidateDialogProps) {
    const { setOverlay } = useCurationStore();

    const handleValidate = () => {
        const publishedAt = new Date().toISOString();
        setOverlay(passport.id, { status: 'validated', publishedAt });
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Valider et publier ce passeport ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le passeport <strong>{passport.garment.reference}</strong> sera publié avec son grade Iris{' '}
                        <strong>{grade}</strong>. Le QR code GS1 sera émis.
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
