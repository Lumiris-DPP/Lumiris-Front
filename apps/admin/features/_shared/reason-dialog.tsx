'use client';

import { useEffect, useState } from 'react';
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

interface ReasonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    placeholder: string;
    confirmLabel: string;
    emphasis?: 'default' | 'destructive';
    onConfirm: (reason: string | undefined) => void;
}

export function ReasonDialog({
    open,
    onOpenChange,
    title,
    description,
    placeholder,
    confirmLabel,
    emphasis = 'default',
    onConfirm,
}: ReasonDialogProps) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!open) setReason('');
    }, [open]);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={placeholder}
                    className="min-h-24"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onConfirm(reason.trim() || undefined)}
                        className={emphasis === 'destructive' ? 'bg-lumiris-rose hover:bg-lumiris-rose/90' : undefined}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
