'use client';

import { useEffect, useState } from 'react';
import type { AdminAuditLogEntry, Passport } from '@lumiris/types';
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
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction } from '@/lib/auth';
import { useCurationStore } from '../curation-store';
import { FLAG_TAGS } from '../types';

interface RejectDialogProps {
    passport: Passport;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAfterAction: (entry: AdminAuditLogEntry) => void;
}

export function RejectDialog({ passport, open, onOpenChange, onAfterAction }: RejectDialogProps) {
    const log = useLogAction();
    const { setOverlay } = useCurationStore();
    const [reason, setReason] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        if (!open) {
            setReason('');
            setTags([]);
            setConfirmed(false);
        }
    }, [open]);

    const handleReject = () => {
        if (!confirmed) return;
        setOverlay(passport.id, { status: 'flagged', flagReason: reason, flagTags: tags });
        const entry = log({
            action: 'passport.flag',
            targetType: 'passport',
            targetId: passport.id,
            payload: { reason, tags, artisanId: passport.artisanId },
        });
        onOpenChange(false);
        onAfterAction(entry);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Rejeter ce passeport</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le passeport sera retiré de la file principale et marqué <strong>rejeté</strong>. Action tracée
                        dans le log de gouvernance.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motif du rejet (composition douteuse, photos recyclées, fausse déclaration…)"
                    className="min-h-24"
                />
                <div className="space-y-1.5">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                        {FLAG_TAGS.map((tag) => {
                            const active = tags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() =>
                                        setTags((prev) =>
                                            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                                        )
                                    }
                                    className={cn(
                                        'rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors',
                                        active
                                            ? 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose'
                                            : 'border-border text-muted-foreground hover:border-lumiris-rose/40 hover:text-lumiris-rose',
                                    )}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <Checkbox
                        id="reject-confirm"
                        checked={confirmed}
                        onCheckedChange={(v) => setConfirmed(v === true)}
                    />
                    <label htmlFor="reject-confirm" className="text-foreground cursor-pointer">
                        Je confirme le rejet
                    </label>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleReject}
                        disabled={!confirmed}
                        className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                    >
                        Rejeter
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
