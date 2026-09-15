'use client';

import { useState } from 'react';
import type { Passport } from '@lumiris/types';
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
import { Textarea } from '@lumiris/ui/components/textarea';
import { useCurationStore } from '../curation-store';

interface RequestChangesDialogProps {
    passport: Passport;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RequestChangesDialog({ passport, open, onOpenChange }: RequestChangesDialogProps) {
    const { setOverlay } = useCurationStore();
    const [message, setMessage] = useState('');

    const handleRequestChanges = () => {
        if (message.trim().length === 0) return;
        setOverlay(passport.id, {
            status: 'changes_requested',
            changesMessage: message,
        });
        setMessage('');
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Demander des changements à l&apos;artisan</AlertDialogTitle>
                    <AlertDialogDescription>
                        Précisez ce qui doit être complété ou corrigé. Un message sera envoyé à l&apos;artisan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Exemple : il manque la photo de l'étape 3 et le fournisseur du fil de soie."
                    className="min-h-24"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRequestChanges} disabled={message.trim().length === 0}>
                        Envoyer la demande
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
