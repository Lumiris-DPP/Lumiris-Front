'use client';

import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { AGEC_REQUIRED_FIELDS, ESPR_REQUIRED_FIELDS } from '@lumiris/core/scoring';
import type { Passport, ScoreResult } from '@lumiris/types';
import { IrisGrade, ScoreBreakdown, ScoreCapWarning, ScoreReasonsList } from '@lumiris/scoring-ui';
import { Alert, AlertDescription, AlertTitle } from '@lumiris/ui/components/alert';
import { Card, CardContent } from '@lumiris/ui/components/card';
import { Separator } from '@lumiris/ui/components/separator';
import type { WizardStep } from '@/lib/draft-store';

export interface CompletenessSectionProps {
    passport: Passport;
    score: ScoreResult;
    draftId: string;
}

interface MissingField {
    kind: 'ESPR' | 'AGEC';
    path: string;
    step: WizardStep;
}

const PATH_TO_STEP: Record<string, WizardStep> = {
    'garment.kind': 'identification',
    'garment.reference': 'identification',
    'garment.mainPhotoUrl': 'identification',
    'materials[].fiber': 'composition',
    'materials[].percentage': 'composition',
    'materials[].originCountry': 'composition',
    'materials[].supplierId': 'composition',
    'steps[]': 'manufacturing',
    'warranty.durationMonths': 'certifications',
    'warranty.terms': 'certifications',
    'gs1.verificationUrl': 'publish',
    'care.washing': 'publish',
};

export function CompletenessSection({ passport, score, draftId }: CompletenessSectionProps) {
    const missing = listMissingFields(passport);

    return (
        <Card>
            <CardContent className="space-y-5 pt-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <IrisGrade grade={score.grade} size="xl" shape="square" tone="solid" />
                        <div>
                            <p className="text-foreground font-mono text-3xl font-semibold leading-none">
                                {score.total.toFixed(1)}
                                <span className="text-muted-foreground/70 ml-0.5 text-sm font-normal">/ 100</span>
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">Score Iris final</p>
                        </div>
                    </div>
                </div>

                <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />

                {score.cap?.applied && <ScoreCapWarning cap={score.cap} />}

                {missing.length > 0 ? (
                    <MissingFieldsList draftId={draftId} fields={missing} />
                ) : (
                    <Alert className="border-lumiris-emerald/30 bg-lumiris-emerald/5 text-lumiris-emerald [&>svg]:text-lumiris-emerald">
                        <AlertTitle>Tous les champs ESPR / AGEC sont renseignés</AlertTitle>
                        <AlertDescription className="text-foreground/80">
                            Publication possible en statut « Publié ».
                        </AlertDescription>
                    </Alert>
                )}

                {score.reasons.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                                Motifs de score
                            </p>
                            <ScoreReasonsList reasons={score.reasons} limit={6} />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function MissingFieldsList({ draftId, fields }: { draftId: string; fields: readonly MissingField[] }) {
    return (
        <Alert className="border-lumiris-amber/30 bg-lumiris-amber/5 [&>svg]:text-lumiris-amber">
            <AlertTriangle aria-hidden />
            <AlertTitle className="text-lumiris-amber">
                {fields.length} champ{fields.length > 1 ? 's' : ''} obligatoire{fields.length > 1 ? 's' : ''} manquant
                {fields.length > 1 ? 's' : ''}
            </AlertTitle>
            <AlertDescription>
                <ul className="mt-2 space-y-1">
                    {fields.map((f) => (
                        <li key={`${f.kind}::${f.path}`}>
                            <Link
                                href={`/create/${draftId}/${f.step}`}
                                className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline"
                            >
                                <span className="text-muted-foreground font-mono text-[10px]">{f.kind}</span>
                                <span className="font-mono">{f.path}</span>
                                <ChevronRight className="h-3 w-3" />
                            </Link>
                        </li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
}

function listMissingFields(passport: Passport): MissingField[] {
    const out: MissingField[] = [];
    for (const f of ESPR_REQUIRED_FIELDS) {
        if (!f.isPresent(passport)) {
            out.push({ kind: 'ESPR', path: f.path, step: PATH_TO_STEP[f.path] ?? 'publish' });
        }
    }
    for (const f of AGEC_REQUIRED_FIELDS) {
        if (!f.isPresent(passport)) {
            out.push({ kind: 'AGEC', path: f.path, step: PATH_TO_STEP[f.path] ?? 'publish' });
        }
    }
    return out;
}
