'use client';

import { useEffect, useState } from 'react';
import type { AdminAuditLogEntry, IrisGrade as IrisGradeLetter, Passport, ScoreResult } from '@lumiris/types';
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
import { Input } from '@lumiris/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Textarea } from '@lumiris/ui/components/textarea';
import { useLogAction } from '@/lib/auth';
import { useCurationStore } from '../curation-store';

interface OverrideDialogProps {
    passport: Passport;
    score: ScoreResult;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAfterAction: (entry: AdminAuditLogEntry) => void;
}

export function OverrideDialog({ passport, score, open, onOpenChange, onAfterAction }: OverrideDialogProps) {
    const log = useLogAction();
    const { setOverlay } = useCurationStore();
    const grade = score.grade;
    const [overrideGrade, setOverrideGrade] = useState<IrisGradeLetter>(grade);
    const [reason, setReason] = useState('');
    const [source, setSource] = useState('');
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        if (!open) {
            setOverrideGrade(grade);
            setReason('');
            setSource('');
            setConfirmed(false);
        }
    }, [open, grade]);

    const gradeChanged = overrideGrade !== grade;
    const canSubmit = gradeChanged && confirmed;

    const handleOverride = () => {
        if (!canSubmit) return;
        setOverlay(passport.id, { overrideGrade, overrideReason: reason, overrideSource: source });
        const entry = log({
            action: 'passport.override',
            targetType: 'passport',
            targetId: passport.id,
            payload: {
                from: grade,
                to: overrideGrade,
                fromScore: +score.total.toFixed(1),
                reason,
                source,
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
                    <AlertDialogTitle className="text-lumiris-rose">Override de grade</AlertDialogTitle>
                    <AlertDialogDescription>
                        Vous remplacez le grade calculé par l&apos;algorithme. Action tracée publiquement dans la
                        timeline gouvernance.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Nouveau grade</p>
                        <Select value={overrideGrade} onValueChange={(v) => setOverrideGrade(v as IrisGradeLetter)}>
                            <SelectTrigger className="w-full" aria-label="Nouveau grade">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(['A', 'B', 'C', 'D', 'E'] as const).map((g) => (
                                    <SelectItem key={g} value={g}>
                                        Grade {g} {g === grade ? '(actuel)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label
                            htmlFor="override-reason"
                            className="text-muted-foreground text-[10px] uppercase tracking-wider"
                        >
                            Motif
                        </label>
                        <Textarea
                            id="override-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Audit ré-effectué le 12/05/2026, certif fibre re-validée par GOTS…"
                            className="min-h-24"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label
                            htmlFor="override-source"
                            className="text-muted-foreground text-[10px] uppercase tracking-wider"
                        >
                            Source
                        </label>
                        <Input
                            id="override-source"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            placeholder="Réclamation client #123, ticket audit #45…"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <Checkbox
                            id="override-confirm"
                            checked={confirmed}
                            onCheckedChange={(v) => setConfirmed(v === true)}
                        />
                        <label htmlFor="override-confirm" className="text-foreground cursor-pointer">
                            Je confirme l&apos;override de grade
                        </label>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleOverride}
                        disabled={!canSubmit}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        Confirmer override
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
