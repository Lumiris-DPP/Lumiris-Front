'use client';

import { useMemo, useState } from 'react';
import { Clock, History } from 'lucide-react';
import { IRIS_THRESHOLDS } from '@lumiris/core/scoring';
import type { AdminAuditLogEntry, IrisAxis, IrisGrade as IrisGradeLetter, Passport, ScoreResult } from '@lumiris/types';
import { gradeBackground, gradeColor } from '@lumiris/scoring-ui';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction } from '@/lib/auth';
import { useCurationStore } from '../curation-store';

interface OverrideDialogProps {
    passport: Passport;
    score: ScoreResult;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAfterAction: (entry: AdminAuditLogEntry) => void;
}

const MIN_REASON_LENGTH = 20;

const AXIS_LABEL: Record<IrisAxis, string> = {
    transparency: 'Transparence',
    craftsmanship: 'Savoir-faire',
    impact: 'Impact',
    repairability: 'Réparabilité',
};

const AXIS_MAX_POINTS: Record<IrisAxis, number> = {
    transparency: 40,
    craftsmanship: 25,
    impact: 25,
    repairability: 10,
};

function gradeTargetTotal(grade: IrisGradeLetter): number {
    if (grade === 'A') return IRIS_THRESHOLDS.A;
    if (grade === 'B') return IRIS_THRESHOLDS.B;
    if (grade === 'C') return IRIS_THRESHOLDS.C;
    if (grade === 'D') return IRIS_THRESHOLDS.D;
    return 0;
}

export function OverrideDialog({ passport, score, open, onOpenChange, onAfterAction }: OverrideDialogProps) {
    const log = useLogAction();
    const { setOverlay } = useCurationStore();
    const grade = score.grade;
    const [overrideGrade, setOverrideGrade] = useState<IrisGradeLetter>(grade);
    const [reason, setReason] = useState('');

    const axisDelta = useMemo(() => {
        const currentTotal = score.total;
        const targetTotal = gradeTargetTotal(overrideGrade);
        const totalGap = targetTotal - currentTotal;
        const axes: IrisAxis[] = ['transparency', 'craftsmanship', 'impact', 'repairability'];
        return axes.map((axis) => {
            const currentWeighted = score.breakdown[axis] * score.weights[axis];
            const proposedWeighted = currentWeighted + totalGap * score.weights[axis];
            return {
                axis,
                before: currentWeighted,
                after: proposedWeighted,
                delta: proposedWeighted - currentWeighted,
                max: AXIS_MAX_POINTS[axis],
            };
        });
    }, [score, overrideGrade]);

    const handleOverride = () => {
        if (reason.trim().length < MIN_REASON_LENGTH) return;
        if (overrideGrade === grade) return;
        setOverlay(passport.id, {
            overrideGrade,
            overrideReason: reason,
        });
        const entry = log({
            action: 'passport.override',
            targetType: 'passport',
            targetId: passport.id,
            payload: {
                from: grade,
                to: overrideGrade,
                fromScore: +score.total.toFixed(1),
                toScore: +gradeTargetTotal(overrideGrade).toFixed(1),
                reason,
                artisanId: passport.artisanId,
            },
        });
        setReason('');
        onOpenChange(false);
        onAfterAction(entry);
    };

    const reasonTrimmed = reason.trim();
    const reasonOk = reasonTrimmed.length >= MIN_REASON_LENGTH;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lumiris-cyan">
                        Override de score - gouvernance sensible
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Vous remplacez visuellement le grade calculé par l&apos;algorithme. Cette action est tracée
                        publiquement dans la timeline gouvernance. <strong>Personne n&apos;achète son score</strong> -
                        la raison doit justifier formellement (audit ré-vérifié, certif re-validée…).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3">
                    <div className="border-border bg-muted/30 flex items-center justify-around rounded-xl border p-3">
                        <div className="text-center">
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Grade calculé</p>
                            <span
                                className={cn(
                                    'mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full font-mono text-base font-bold',
                                    gradeBackground(grade),
                                    gradeColor(grade),
                                )}
                            >
                                {grade}
                            </span>
                            <p className="text-muted-foreground mt-1 font-mono text-[10px]">
                                {score.total.toFixed(1)} pts
                            </p>
                        </div>
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <div className="text-center">
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Nouveau grade</p>
                            <span
                                className={cn(
                                    'mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full font-mono text-base font-bold',
                                    gradeBackground(overrideGrade),
                                    gradeColor(overrideGrade),
                                )}
                            >
                                {overrideGrade}
                            </span>
                            <p className="text-muted-foreground mt-1 font-mono text-[10px]">
                                {gradeTargetTotal(overrideGrade).toFixed(1)} pts (seuil)
                            </p>
                        </div>
                    </div>
                    <Select value={overrideGrade} onValueChange={(v) => setOverrideGrade(v as IrisGradeLetter)}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {(['A', 'B', 'C', 'D', 'E'] as const).map((g) => (
                                <SelectItem key={g} value={g}>
                                    Grade {g}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {overrideGrade !== grade ? (
                        <div className="border-border bg-card rounded-xl border p-3">
                            <p className="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">
                                Delta par axe (réparti au prorata des poids canoniques)
                            </p>
                            <ul className="space-y-1.5 text-xs">
                                {axisDelta.map((d) => {
                                    const tone =
                                        d.delta > 0.05
                                            ? 'text-lumiris-emerald'
                                            : d.delta < -0.05
                                              ? 'text-lumiris-rose'
                                              : 'text-muted-foreground';
                                    return (
                                        <li key={d.axis} className="flex items-center justify-between">
                                            <span className="text-foreground">{AXIS_LABEL[d.axis]}</span>
                                            <span className="font-mono">
                                                {d.before.toFixed(1)} → {d.after.toFixed(1)} / {d.max}{' '}
                                                <span className={tone}>
                                                    ({d.delta > 0 ? '+' : ''}
                                                    {d.delta.toFixed(1)})
                                                </span>
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : null}
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={`Justification (${MIN_REASON_LENGTH}+ caractères) : audit ré-effectué, certif re-validée, etc.`}
                        className="min-h-24"
                    />
                    <p
                        className={cn(
                            'text-right font-mono text-[10px]',
                            reasonOk ? 'text-lumiris-emerald' : 'text-muted-foreground',
                        )}
                    >
                        {reasonTrimmed.length} / {MIN_REASON_LENGTH}
                    </p>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleOverride}
                        disabled={!reasonOk || overrideGrade === grade}
                        className="bg-lumiris-cyan hover:bg-lumiris-cyan/90"
                    >
                        <History className="mr-1 h-3.5 w-3.5" /> Confirmer override
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
