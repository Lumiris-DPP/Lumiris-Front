'use client';

import Link from 'next/link';
import { AlertTriangle, Check } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockCertificates } from '@lumiris/mock-data';
import { IrisGrade, ScoreBreakdown, MissingFieldsBadge, ScoreCapWarning } from '@lumiris/scoring-ui';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { cn } from '@lumiris/ui/lib/cn';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { draftToPassport, useDraftStore, WIZARD_STEPS, type WizardStep } from '@/lib/draft-store';
import type { DraftLike, ValidateStepResult } from './use-step-navigation';
import { validateStep as validateIdentification } from '@/features/create-step-identification/schema';
import { validateStep as validateComposition } from '@/features/create-step-composition/schema';
import { validateStep as validateInvoice } from '@/features/create-step-invoice-scan/schema';
import { validateStep as validateManufacturing } from '@/features/create-step-manufacturing/schema';
import { validateStep as validateCertifications } from '@/features/create-step-certifications/schema';
import { validateStep as validatePublish } from '@/features/create-step-publish/schema';

const STEP_LABELS: Record<WizardStep, string> = {
    identification: 'Identification',
    composition: 'Composition',
    invoice: 'Factures',
    manufacturing: 'Étapes de fabrication',
    certifications: 'Certifications produit',
    publish: 'Publication',
};

export const STEP_VALIDATORS: Record<WizardStep, (d: DraftLike) => ValidateStepResult> = {
    identification: validateIdentification,
    composition: validateComposition,
    invoice: validateInvoice,
    manufacturing: validateManufacturing,
    certifications: validateCertifications,
    publish: validatePublish,
};

interface WizardShellProps {
    draftId: string;
    step: WizardStep;
    children: React.ReactNode;
    onPrev?: () => void;
    onNext?: () => void;
    nextLabel?: string;
    nextMissing?: string[];
}

export function WizardShell({
    draftId,
    step,
    children,
    onPrev,
    onNext,
    nextLabel = 'Suivant',
    nextMissing = [],
}: WizardShellProps) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const artisan = useCurrentArtisan();

    if (!draft) {
        return (
            <div className="p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Brouillon introuvable</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-muted-foreground text-sm">
                            Ce brouillon n’existe pas ou a été supprimé. Vous pouvez en démarrer un nouveau.
                        </p>
                        <Button asChild>
                            <Link href="/create">Créer un nouveau passeport</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const passport = draftToPassport(draft);
    const score = computeScore(passport, {
        artisan,
        certificates: mockCertificates,
        now: new Date(),
    });

    const nextDisabled = nextMissing.length > 0;

    return (
        <TooltipProvider delayDuration={200}>
            <div className="grid gap-6 p-8 lg:grid-cols-[1fr_320px]">
                <div className="min-w-0 space-y-6">
                    <Stepper currentStep={step} draftId={draftId} draft={draft} />
                    <div>{children}</div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                        {onPrev ? (
                            <Button variant="outline" onClick={onPrev}>
                                Étape précédente
                            </Button>
                        ) : (
                            <span />
                        )}
                        {onNext && (
                            <NextButton
                                label={nextLabel}
                                disabled={nextDisabled}
                                missing={nextMissing}
                                onClick={onNext}
                            />
                        )}
                    </div>
                </div>

                <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                    <Card>
                        <CardHeader>
                            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                                Score Iris provisoire
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                                <IrisGrade grade={score.grade} size="lg" />
                                <div>
                                    <p className="text-foreground font-mono text-2xl font-semibold">
                                        {score.total.toFixed(1)}
                                        <span className="text-muted-foreground/70 ml-0.5 text-sm font-normal">
                                            / 100
                                        </span>
                                    </p>
                                    <p className="text-muted-foreground text-xs">Recalculé en direct</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                            {score.cap?.applied && <ScoreCapWarning cap={score.cap} />}
                            <div className="flex items-center justify-between border-t pt-3">
                                <span className="text-muted-foreground text-xs">Champs ESPR/AGEC</span>
                                <MissingFieldsBadge passport={passport} showWhenComplete />
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </TooltipProvider>
    );
}

type StepState = 'done' | 'current' | 'todo' | 'error';

function Stepper({ currentStep, draftId, draft }: { currentStep: WizardStep; draftId: string; draft: DraftLike }) {
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    const currentValidation = STEP_VALIDATORS[currentStep](draft);
    const currentValid = currentValidation.ok;

    return (
        <ol className="border-border bg-card flex w-full flex-wrap items-center gap-1 rounded-xl border p-3 text-xs">
            {WIZARD_STEPS.map((s, i) => {
                const validation = STEP_VALIDATORS[s](draft);
                const state: StepState =
                    i === currentIndex ? 'current' : i < currentIndex ? (validation.ok ? 'done' : 'error') : 'todo';

                const canClick = i <= currentIndex || currentValid;
                const missing = validation.ok ? [] : validation.missing;

                const link = (
                    <Link
                        href={canClick ? `/create/${draftId}/${s}` : `/create/${draftId}/${currentStep}`}
                        aria-current={state === 'current' ? 'step' : undefined}
                        aria-disabled={!canClick}
                        onClick={(e) => {
                            if (!canClick) e.preventDefault();
                        }}
                        className={cn(
                            'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                            state === 'current' && 'bg-lumiris-emerald/10 text-lumiris-emerald font-medium',
                            state === 'done' && 'text-muted-foreground hover:bg-muted',
                            state === 'error' && 'text-lumiris-amber hover:bg-lumiris-amber/10',
                            state === 'todo' && 'text-muted-foreground hover:bg-muted',
                            !canClick && 'cursor-not-allowed opacity-60 hover:bg-transparent',
                        )}
                    >
                        <StepBadge index={i} state={state} />
                        <span className="truncate">{STEP_LABELS[s]}</span>
                    </Link>
                );

                return (
                    <li key={s} className="flex flex-1 items-center gap-1">
                        {state === 'error' && missing.length > 0 ? (
                            <Tooltip>
                                <TooltipTrigger asChild>{link}</TooltipTrigger>
                                <TooltipContent>{formatMissingTooltip(missing)}</TooltipContent>
                            </Tooltip>
                        ) : (
                            link
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

function StepBadge({ index, state }: { index: number; state: StepState }) {
    if (state === 'done') {
        return (
            <span className="bg-lumiris-emerald flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white">
                <Check className="h-3 w-3" />
            </span>
        );
    }
    if (state === 'current') {
        return (
            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                <span className="bg-lumiris-emerald/30 absolute inset-0 animate-ping rounded-full" aria-hidden />
                <span className="bg-lumiris-emerald/20 text-lumiris-emerald relative flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px]">
                    {index + 1}
                </span>
            </span>
        );
    }
    if (state === 'error') {
        return (
            <span className="bg-lumiris-amber/20 text-lumiris-amber flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                <AlertTriangle className="h-3 w-3" />
            </span>
        );
    }
    return (
        <span className="bg-muted text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px]">
            {index + 1}
        </span>
    );
}

function NextButton({
    label,
    disabled,
    missing,
    onClick,
}: {
    label: string;
    disabled: boolean;
    missing: string[];
    onClick: () => void;
}) {
    const button = (
        <Button
            onClick={onClick}
            disabled={disabled}
            className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-white"
        >
            {label}
        </Button>
    );
    if (!disabled || missing.length === 0) return button;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span>{button}</span>
            </TooltipTrigger>
            <TooltipContent>{formatMissingTooltip(missing)}</TooltipContent>
        </Tooltip>
    );
}

function formatMissingTooltip(missing: string[]): string {
    const head = missing.slice(0, 3).join(' · ');
    if (missing.length <= 3)
        return `Champ${missing.length > 1 ? 's' : ''} manquant${missing.length > 1 ? 's' : ''} : ${head}`;
    return `Champs manquants : ${head} et ${missing.length - 3} autre${missing.length - 3 > 1 ? 's' : ''}`;
}
