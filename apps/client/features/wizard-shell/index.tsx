'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { computeScore } from '@lumiris/core/scoring';
import { mockCertificates } from '@lumiris/mock-data';
import { Alert, AlertDescription, AlertTitle } from '@lumiris/ui/components/alert';
import { Button } from '@lumiris/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@lumiris/ui/components/card';
import { useCurrentArtisan } from '@/lib/current-artisan';
import { draftToPassport, useDraftStore, type WizardStep } from '@/lib/draft-store';
import { ScoreSidebar } from './score-sidebar';
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
    const artisan = useCurrentArtisan();

    if (!draft) return <DraftNotFound />;

    const passport = draftToPassport(draft);
    const score = computeScore(passport, { artisan, certificates: mockCertificates, now: new Date() });
    const nextDisabled = nextMissing.length > 0;

    return (
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px] lg:p-8">
            <div className="min-w-0 space-y-6">
                <Stepper draftId={draftId} currentStep={step} draft={draft} />
                {nextMissing.length > 0 && <MissingAlert missing={nextMissing} />}
                <div>{children}</div>
                {!hideNav && (onPrev || onNext) && (
                    <div className="flex items-center justify-between gap-3 pt-2">
                        {onPrev ? (
                            <Button variant="outline" onClick={onPrev}>
                                Précédent
                            </Button>
                        ) : (
                            <span />
                        )}
                        {onNext && (
                            <Button
                                onClick={onNext}
                                disabled={nextDisabled}
                                className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-white"
                            >
                                {nextLabel}
                            </Button>
                        )}
                    </div>
                )}
            </div>
            <ScoreSidebar passport={passport} score={score} />
        </div>
    );
}

function MissingAlert({ missing }: { missing: string[] }) {
    return (
        <Alert className="border-lumiris-amber/30 bg-lumiris-amber/5 text-lumiris-amber">
            <AlertTriangle aria-hidden />
            <AlertTitle>Champs requis avant l’étape suivante</AlertTitle>
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
