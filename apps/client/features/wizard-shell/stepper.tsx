'use client';

import Link from 'next/link';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';
import { WIZARD_STEPS, type WizardStep } from '@/lib/draft-store';
import { STEP_VALIDATORS } from './step-validators';
import type { DraftLike } from './use-step-navigation';

const STEP_LABELS: Record<WizardStep, string> = {
    identification: 'Identification',
    composition: 'Composition',
    invoice: 'Factures',
    manufacturing: 'Fabrication',
    certifications: 'Certifications',
    publish: 'Publication',
};

type StepState = 'done' | 'current' | 'todo' | 'error';

interface StepperProps {
    draftId: string;
    currentStep: WizardStep;
    draft: DraftLike;
}

export function Stepper({ draftId, currentStep, draft }: StepperProps) {
    const currentIndex = WIZARD_STEPS.indexOf(currentStep);
    const currentValid = STEP_VALIDATORS[currentStep](draft).ok;

    return (
        <ol className="flex w-full items-start gap-1 sm:gap-2" aria-label="Étapes du wizard">
            {WIZARD_STEPS.map((s, i) => {
                const validation = STEP_VALIDATORS[s](draft);
                const state: StepState =
                    i === currentIndex ? 'current' : i < currentIndex ? (validation.ok ? 'done' : 'error') : 'todo';
                const canClick = i <= currentIndex || currentValid;
                const isLast = i === WIZARD_STEPS.length - 1;
                const connectorPast = i < currentIndex;

                return (
                    <li key={s} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                        <div className="flex w-full items-center">
                            <span
                                className={cn(
                                    'h-px flex-1',
                                    i === 0
                                        ? 'opacity-0'
                                        : connectorPast || state === 'current'
                                          ? 'bg-primary/60'
                                          : 'bg-border',
                                )}
                            />
                            <Link
                                href={canClick ? `/create/${draftId}/${s}` : `/create/${draftId}/${currentStep}`}
                                aria-current={state === 'current' ? 'step' : undefined}
                                aria-disabled={!canClick}
                                tabIndex={canClick ? 0 : -1}
                                onClick={(e) => {
                                    if (!canClick) e.preventDefault();
                                }}
                                className={cn(
                                    'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold transition-colors',
                                    badgeClass(state),
                                    state === 'current' &&
                                        'ring-primary/40 ring-offset-background ring-2 ring-offset-2',
                                    !canClick && 'cursor-not-allowed opacity-60',
                                )}
                            >
                                {state === 'done' ? (
                                    <Check className="h-4 w-4" />
                                ) : state === 'error' ? (
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                ) : (
                                    i + 1
                                )}
                            </Link>
                            <span
                                className={cn(
                                    'h-px flex-1',
                                    isLast ? 'opacity-0' : connectorPast ? 'bg-primary/60' : 'bg-border',
                                )}
                            />
                        </div>
                        <span
                            className={cn(
                                'truncate text-center text-[11px] tracking-tight',
                                state === 'current' ? 'text-foreground font-medium' : 'text-muted-foreground',
                            )}
                        >
                            {STEP_LABELS[s]}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function badgeClass(state: StepState): string {
    switch (state) {
        case 'done':
            return 'border-lumiris-emerald bg-lumiris-emerald text-white';
        case 'current':
            return 'border-lumiris-emerald bg-background text-lumiris-emerald';
        case 'error':
            return 'border-lumiris-amber bg-lumiris-amber/10 text-lumiris-amber';
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
}
