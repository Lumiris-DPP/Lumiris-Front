'use client';

import Link from 'next/link';
import { useMemo, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@lumiris/ui/components/alert';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { IrisScoreCard } from '@lumiris/scoring-ui';
import type { DppScoreInput } from '@lumiris/types';
import { useDraftHydrated, useDraftStore, type WizardStep } from '@/lib/draft-store';
import { Stepper } from './stepper';

export { STEP_VALIDATORS } from './step-validators';

interface WizardShellProps {
    draftId: string;
    step: WizardStep;
    children: React.ReactNode;
    onPrev?: () => void;
    onNext?: () => void;
    nextLabel?: string;
    nextMissing?: string[];
    hideNav?: boolean;
}

export function WizardShell({
    draftId,
    step,
    children,
    onPrev,
    onNext,
    nextLabel = 'Suivant',
    nextMissing = [],
    hideNav = false,
}: WizardShellProps) {
    const draft = useDraftStore((s) => s.drafts[draftId]);
    const hydrated = useDraftHydrated();
    const navigatingRef = useRef(false);

    const draftPayload = useMemo(
        (): DppScoreInput => ({
            originCountry: draft?.garment?.originCountry,
            productCategory: draft?.garment?.category,
            repairable: draft?.eco?.isRepairable,
            reachCompliant: draft?.traceability?.reachCompliant,
            endOfLifeInstructions: draft?.eco?.endOfLifeInstructions,
            weightGrams: draft?.garment?.dimensions?.weightG,
            recycledPct: draft?.eco?.recycledPct,
            warrantyMonths: draft?.eco?.warrantyMonths,
            materials:
                draft?.materials?.map((m) => ({
                    fiber: m.fiber,
                    percentage: m.percentage,
                    originCountry: m.originCountry,
                })) ?? [],
            presentDocuments: [
                ...new Set([...Object.keys(draft?.files ?? {}), ...Object.keys(draft?.existingDocs ?? {})]),
            ],
        }),
        [
            draft?.garment,
            draft?.traceability?.reachCompliant,
            draft?.eco,
            draft?.materials,
            draft?.files,
            draft?.existingDocs,
        ],
    );

    // Wait for persisted drafts to rehydrate before deciding the draft is missing,
    // otherwise a hard refresh mid-wizard would flash "brouillon introuvable".
    if (!hydrated) return null;
    if (!draft) return <DraftNotFound />;

    const nextDisabled = nextMissing.length > 0;

    const handleNext = onNext
        ? () => {
              navigatingRef.current = true;
              onNext();
          }
        : undefined;

    return (
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px] lg:p-8">
            <div className="min-w-0 space-y-6">
                <Stepper draftId={draftId} currentStep={step} draft={draft} />
                {nextMissing.length > 0 && <MissingAlert missing={nextMissing} />}
                <div>{children}</div>
                {!hideNav && (onPrev || handleNext) && (
                    <div className="flex items-center justify-between gap-3 pt-2">
                        {onPrev ? (
                            <Button variant="outline" onClick={onPrev}>
                                Précédent
                            </Button>
                        ) : (
                            <span />
                        )}
                        {handleNext && (
                            <Button
                                onClick={handleNext}
                                disabled={nextDisabled}
                                className="bg-lumiris-cyan text-white hover:bg-lumiris-cyan/90"
                            >
                                {nextLabel}
                            </Button>
                        )}
                    </div>
                )}
            </div>
            <div className="lg:sticky lg:top-20 lg:self-start">
                <IrisScoreCard draft={navigatingRef.current ? undefined : draftPayload} variant="responsive" />
            </div>
        </div>
    );
}

function MissingAlert({ missing }: { missing: string[] }) {
    return (
        <Alert className="border-lumiris-amber/30 bg-lumiris-amber/5 text-lumiris-amber">
            <AlertTriangle aria-hidden />
            <AlertTitle>Champs requis avant l&apos;étape suivante</AlertTitle>
            <AlertDescription className="text-foreground/80">{missing.join(' · ')}</AlertDescription>
        </Alert>
    );
}

function DraftNotFound() {
    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Brouillon introuvable</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Ce brouillon n&apos;existe pas ou a été supprimé. Vous pouvez en démarrer un nouveau.
                    </p>
                    <Button asChild>
                        <Link href="/create">Créer un nouveau passeport</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
