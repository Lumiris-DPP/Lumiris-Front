'use client';

import { useState } from 'react';
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
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction } from '@/lib/auth';
import { useCurationStore } from '../curation-store';
import { FLAG_TAGS } from '../types';

interface FlagDialogProps {
    passport: Passport;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAfterAction: (entry: AdminAuditLogEntry) => void;
}

export function FlagDialog({ passport, open, onOpenChange, onAfterAction }: FlagDialogProps) {
    const log = useLogAction();
    const { setOverlay } = useCurationStore();
    const [reason, setReason] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    const handleFlag = () => {
        if (reason.trim().length === 0) return;
        setOverlay(passport.id, {
            status: 'flagged',
            flagReason: reason,
            flagTags: tags,
        });
        const entry = log({
            action: 'passport.flag',
            targetType: 'passport',
            targetId: passport.id,
            payload: { reason, tags, artisanId: passport.artisanId },
        });
        setReason('');
        setTags([]);
        onOpenChange(false);
        onAfterAction(entry);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Flagger une anomalie</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le passeport sera marqué <strong>flagged</strong>, soustrait de la file principale et
                        nécessitera une revue lead curator.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Raison de l'anomalie (libre)…"
                    className="min-h-20"
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
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleFlag}
                        disabled={reason.trim().length === 0}
                        className="bg-lumiris-rose hover:bg-lumiris-rose/90"
                    >
                        Flagger
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
