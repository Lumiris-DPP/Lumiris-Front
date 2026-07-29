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
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { RATE_CHANGE_REASON_MIN_LENGTH } from '@/lib/affiliation-config';

export interface RateChangeTarget {
    label: string;
    current: number;
    suffix: string;
    bounds: { min: number; max: number };
    validate: (value: number) => string | null;
}

interface RateChangeDialogProps {
    target: RateChangeTarget | null;
    onCancel: () => void;
    onConfirm: (newValue: number, reason: string) => void;
}

export function RateChangeDialog({ target, onCancel, onConfirm }: RateChangeDialogProps) {
    const [draft, setDraft] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        setDraft(target ? String(target.current) : '');
        setReason('');
    }, [target]);

    const parsed = Number(draft);
    const valueError = target ? target.validate(parsed) : null;
    const dirty = target ? parsed !== target.current && Number.isFinite(parsed) : false;
    const reasonTooShort = reason.trim().length < RATE_CHANGE_REASON_MIN_LENGTH;
    const disabled = !target || !dirty || valueError !== null || reasonTooShort;

    return (
        <AlertDialog open={target !== null} onOpenChange={(o) => !o && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Modifier le taux — {target?.label}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Borne légale : {target?.bounds.min}-{target?.bounds.max} {target?.suffix}. Taux courant :{' '}
                        <strong>
                            {target?.current} {target?.suffix}
                        </strong>
                        . Toute modification est tracée dans l&apos;audit log avec une justification ≥{' '}
                        {RATE_CHANGE_REASON_MIN_LENGTH} caractères.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="rate-change-value" className="mb-1.5 text-xs text-foreground">
                            Nouveau taux
                        </Label>
                        <div className="relative">
                            <Input
                                id="rate-change-value"
                                type="number"
                                step="0.5"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                className={cn(
                                    'w-32 pr-8 font-mono text-sm',
                                    valueError ? 'border-lumiris-rose/60 focus-visible:ring-lumiris-rose/30' : '',
                                )}
                            />
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-muted-foreground">
                                {target?.suffix}
                            </span>
                        </div>
                        {valueError ? <p className="mt-1 text-[10px] text-lumiris-rose">{valueError}</p> : null}
                    </div>
                    <div>
                        <Label htmlFor="rate-change-reason" className="mb-1.5 text-xs text-foreground">
                            Justification métier
                        </Label>
                        <Textarea
                            id="rate-change-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex. alignement avec la grille tarifaire 2026 votée le 12 mai…"
                            className="min-h-24"
                        />
                        <p
                            className={cn(
                                'mt-1 text-[11px]',
                                reasonTooShort ? 'text-lumiris-rose' : 'text-lumiris-emerald',
                            )}
                        >
                            {reason.trim().length} / {RATE_CHANGE_REASON_MIN_LENGTH} caractères
                        </p>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction disabled={disabled} onClick={() => target && onConfirm(parsed, reason.trim())}>
                        Confirmer la modification
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
