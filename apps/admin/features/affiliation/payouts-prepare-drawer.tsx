'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, CalendarRange, Check } from 'lucide-react';
import { Button } from '@lumiris/ui/components/button';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Label } from '@lumiris/ui/components/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';

type StepValue = 'period' | 'preview' | 'confirm';

interface Step {
    value: StepValue;
    label: string;
}

const STEPS: readonly Step[] = [
    { value: 'period', label: 'Période' },
    { value: 'preview', label: 'Aperçu' },
    { value: 'confirm', label: 'Confirmation' },
];

export interface PayoutBeneficiaryPreview {
    id: string;
    name: string;
    amountEur: number;
    eventCount: number;
}

interface PayoutsPrepareDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    period: string;
    totalEur: number;
    beneficiaryCount: number;
    excludedCount: number;
    beneficiaries: readonly PayoutBeneficiaryPreview[];
}

export function PayoutsPrepareDrawer({
    open,
    onOpenChange,
    onConfirm,
    period,
    totalEur,
    beneficiaryCount,
    excludedCount,
    beneficiaries,
}: PayoutsPrepareDrawerProps) {
    const [step, setStep] = useState<StepValue>('period');
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        if (!open) {
            setStep('period');
            setConfirmed(false);
        }
    }, [open]);

    const currentStepIndex = useMemo(() => STEPS.findIndex((s) => s.value === step), [step]);

    const goNext = () => {
        const next = STEPS[currentStepIndex + 1];
        if (next) setStep(next.value);
    };
    const goPrev = () => {
        const prev = STEPS[currentStepIndex - 1];
        if (prev) setStep(prev.value);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg">
                <SheetHeader className="border-b border-border px-5 py-4">
                    <SheetTitle>Préparer payout</SheetTitle>
                    <SheetDescription>
                        {currentStepIndex + 1} / {STEPS.length} · {STEPS[currentStepIndex]?.label}
                    </SheetDescription>
                </SheetHeader>

                <StepIndicator currentIndex={currentStepIndex} />

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {step === 'period' ? (
                        <PeriodStep
                            period={period}
                            beneficiaryCount={beneficiaryCount}
                            eligibleCount={beneficiaries.length}
                            excludedCount={excludedCount}
                            totalEur={totalEur}
                        />
                    ) : null}
                    {step === 'preview' ? <PreviewStep beneficiaries={beneficiaries} totalEur={totalEur} /> : null}
                    {step === 'confirm' ? (
                        <ConfirmStep
                            period={period}
                            totalEur={totalEur}
                            beneficiaryCount={beneficiaryCount}
                            excludedCount={excludedCount}
                            confirmed={confirmed}
                            onConfirmedChange={setConfirmed}
                        />
                    ) : null}
                </div>

                <div className="flex items-center justify-between border-t border-border bg-background px-5 py-3">
                    {step === 'period' ? (
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={goPrev}>
                            Précédent
                        </Button>
                    )}
                    {step === 'confirm' ? (
                        <Button size="sm" onClick={onConfirm} disabled={!confirmed} className="gap-1.5">
                            <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden /> Confirmer &amp; exporter CSV
                        </Button>
                    ) : (
                        <Button size="sm" onClick={goNext} className="gap-1.5">
                            Suivant
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function StepIndicator({ currentIndex }: { currentIndex: number }) {
    return (
        <ol className="flex items-center gap-2 border-b border-border px-5 py-3 text-[11px]">
            {STEPS.map((step, index) => {
                const isActive = index === currentIndex;
                const isDone = index < currentIndex;
                return (
                    <li key={step.value} className="flex flex-1 items-center gap-2">
                        <span
                            className={cn(
                                'flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px]',
                                isActive && 'bg-foreground text-background',
                                isDone && 'bg-lumiris-emerald/20 text-lumiris-emerald',
                                !isActive && !isDone && 'border border-border text-muted-foreground',
                            )}
                            aria-hidden
                        >
                            {isDone ? <Check className="h-3 w-3" /> : index + 1}
                        </span>
                        <span
                            className={cn(
                                'truncate',
                                isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                            )}
                        >
                            {step.label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function PeriodStep({
    period,
    beneficiaryCount,
    eligibleCount,
    excludedCount,
    totalEur,
}: {
    period: string;
    beneficiaryCount: number;
    eligibleCount: number;
    excludedCount: number;
    totalEur: number;
}) {
    return (
        <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <CalendarRange className="mt-0.5 h-5 w-5 text-muted-foreground" aria-hidden />
                <div>
                    <p className="font-semibold text-foreground">Période : {period}</p>
                </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
                <Stat label="Bénéficiaires" value={String(beneficiaryCount)} />
                <Stat label="Événements éligibles" value={String(eligibleCount)} />
                <Stat label="Événements exclus" value={String(excludedCount)} accent="text-lumiris-amber" />
                <Stat label="Total à verser" value={`${totalEur.toFixed(2)} €`} accent="text-lumiris-emerald" />
            </dl>
        </div>
    );
}

function PreviewStep({
    beneficiaries,
    totalEur,
}: {
    beneficiaries: readonly PayoutBeneficiaryPreview[];
    totalEur: number;
}) {
    if (beneficiaries.length === 0) {
        return <p className="text-xs text-muted-foreground italic">Aucun bénéficiaire éligible sur la période.</p>;
    }
    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
                {beneficiaries.length} bénéficiaire(s) — total{' '}
                <strong className="font-mono text-foreground">{totalEur.toFixed(2)} €</strong>.
            </p>
            <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Bénéficiaire</TableHead>
                            <TableHead className="text-right">Évén.</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {beneficiaries.map((b) => (
                            <TableRow key={b.id}>
                                <TableCell>
                                    <p className="text-sm text-foreground">{b.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{b.id}</p>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">{b.eventCount}</TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                    {b.amountEur.toFixed(2)} €
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function ConfirmStep({
    period,
    totalEur,
    beneficiaryCount,
    excludedCount,
    confirmed,
    onConfirmedChange,
}: {
    period: string;
    totalEur: number;
    beneficiaryCount: number;
    excludedCount: number;
    confirmed: boolean;
    onConfirmedChange: (v: boolean) => void;
}) {
    return (
        <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold text-foreground">Récapitulatif — {period}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>
                        <strong className="font-mono text-foreground">{beneficiaryCount}</strong> bénéficiaire(s)
                    </li>
                    <li>
                        <strong className="font-mono text-foreground">{totalEur.toFixed(2)} €</strong> versés
                    </li>
                    <li>
                        <strong className="font-mono text-foreground">{excludedCount}</strong> événement(s) exclu(s)
                        (patterns suspects ou flag manuel)
                    </li>
                </ul>
            </div>
            <div className="inline-flex items-start gap-2">
                <Checkbox
                    id="payout-prepare-confirm"
                    checked={confirmed}
                    onCheckedChange={(v) => onConfirmedChange(Boolean(v))}
                />
                <Label htmlFor="payout-prepare-confirm" className="cursor-pointer text-xs text-foreground">
                    Je confirme — l&apos;action est tracée. ({period} · total{' '}
                    <strong className="font-mono">{totalEur.toFixed(2)} €</strong>).
                </Label>
            </div>
        </div>
    );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div>
            <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">{label}</dt>
            <dd className={cn('mt-0.5 font-mono text-base font-semibold text-foreground', accent)}>{value}</dd>
        </div>
    );
}
