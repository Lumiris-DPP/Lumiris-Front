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
import { cn } from '@lumiris/ui/lib/cn';

export interface PublishDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onConfirm: () => void;
    incomplete: boolean;
}

export function PublishDialog({ open, onOpenChange, onConfirm, incomplete }: PublishDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Publier ce passeport ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {incomplete
                            ? 'Des champs obligatoires sont manquants — le passeport sera sauvegardé en « En complétion ». Vous pourrez le finaliser plus tard.'
                            : 'Le passeport sera visible publiquement via son QR code et accessible depuis VISION.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={cn(
                            'text-white',
                            incomplete
                                ? 'bg-lumiris-amber hover:bg-lumiris-amber/90'
                                : 'bg-lumiris-emerald hover:bg-lumiris-emerald/90',
                        )}
                    >
                        {incomplete ? 'Sauvegarder en complétion' : 'Publier'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
