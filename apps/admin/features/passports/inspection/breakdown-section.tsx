'use client';

import { useMemo, useState } from 'react';
import { FileCheck2 } from 'lucide-react';
import { AGEC_REQUIRED_FIELDS, ESPR_REQUIRED_FIELDS, checkCaps } from '@lumiris/core/scoring';
import type { Passport, ScoreResult } from '@lumiris/types';
import { IrisGrade, MissingFieldsBadge, ScoreBreakdown, ScoreCapWarning } from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { cn } from '@lumiris/ui/lib/cn';
import { AXIS_LABEL } from './types';

interface BreakdownSectionProps {
    passport: Passport;
    score: ScoreResult;
}

interface FieldRow {
    path: string;
    present: boolean;
    family: 'ESPR' | 'AGEC';
}

const VISIBLE_REASONS = 6;

function computeFieldRows(passport: Passport): readonly FieldRow[] {
    return [
        ...ESPR_REQUIRED_FIELDS.map((f) => ({
            path: f.path,
            present: f.isPresent(passport),
            family: 'ESPR' as const,
        })),
        ...AGEC_REQUIRED_FIELDS.map((f) => ({
            path: f.path,
            present: f.isPresent(passport),
            family: 'AGEC' as const,
        })),
    ];
}

export function BreakdownSection({ passport, score }: BreakdownSectionProps) {
    const fieldRows = useMemo(() => computeFieldRows(passport), [passport]);
    const capDecision = useMemo(() => checkCaps(passport), [passport]);
    const missingCount = capDecision.missingFields.length;
    const completedCount = fieldRows.length - missingCount;
    const [fieldsOpen, setFieldsOpen] = useState(false);

    const visibleReasons = score.reasons.slice(0, VISIBLE_REASONS);

    return (
        <section className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
                <div className="space-y-4">
                    {score.cap?.applied ? <ScoreCapWarning cap={score.cap} /> : null}
                    <div className="rounded-xl border border-border bg-card p-5">
                        <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                    </div>
                </div>

                <aside className="space-y-3">
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4">
                        <IrisGrade grade={score.grade} size="xl" shape="square" />
                        <p className="text-[11px] text-muted-foreground">
                            {score.cap?.applied ? 'Grade plafonné' : 'Grade calculé'}
                        </p>
                        <p className="font-mono text-lg text-foreground">{score.total.toFixed(1)} / 100</p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs">
                        <span className="text-muted-foreground">Champs manquants</span>
                        <MissingFieldsBadge passport={passport} showWhenComplete />
                    </div>
                </aside>
            </div>

            {score.reasons.length > 0 ? (
                <div className="rounded-xl border border-border bg-card p-5">
                    <p className="mb-3 text-sm font-semibold text-foreground">Justifications</p>
                    <ReasonList reasons={visibleReasons} />
                </div>
            ) : null}

            <Button variant="outline" size="sm" onClick={() => setFieldsOpen(true)} className="gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5" aria-hidden />
                Voir détail ESPR / AGEC
                <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                    {completedCount}/{fieldRows.length}
                </span>
            </Button>

            <Sheet open={fieldsOpen} onOpenChange={setFieldsOpen}>
                <SheetContent side="right" className="w-160 max-w-[95vw] sm:max-w-160">
                    <SheetHeader>
                        <SheetTitle>Champs obligatoires ESPR / AGEC</SheetTitle>
                        <SheetDescription>
                            {completedCount} sur {fieldRows.length} champs renseignés. Les champs manquants déclenchent
                            le plafonnement à D.
                        </SheetDescription>
                    </SheetHeader>
                    <ul className="grid grid-cols-1 gap-1.5 overflow-y-auto px-5 pb-5 md:grid-cols-2">
                        {fieldRows.map((row) => (
                            <li
                                key={`${row.family}-${row.path}`}
                                className="flex items-center gap-2 text-xs"
                                aria-label={`${row.family} ${row.path} ${row.present ? 'complet' : 'manquant'}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={row.present}
                                    readOnly
                                    tabIndex={-1}
                                    aria-hidden
                                    className="h-3.5 w-3.5 accent-lumiris-emerald"
                                />
                                <Badge variant="outline" className="font-mono text-[10px]">
                                    {row.family}
                                </Badge>
                                <code
                                    className={cn(
                                        'truncate',
                                        row.present ? 'text-muted-foreground' : 'font-medium text-foreground',
                                    )}
                                >
                                    {row.path}
                                </code>
                            </li>
                        ))}
                    </ul>
                </SheetContent>
            </Sheet>
        </section>
    );
}

function ReasonList({ reasons }: { reasons: ReadonlyArray<ScoreResult['reasons'][number]> }) {
    return (
        <ul className="space-y-1.5 text-xs">
            {reasons.map((r, i) => (
                <li key={i} className="inline-flex items-baseline gap-2 text-muted-foreground">
                    <Badge
                        variant="outline"
                        className={cn(
                            'shrink-0 font-mono text-[10px]',
                            r.severity === 'error'
                                ? 'border-lumiris-rose/40 text-lumiris-rose'
                                : r.severity === 'warn'
                                  ? 'border-lumiris-amber/40 text-lumiris-amber'
                                  : 'border-lumiris-cyan/40 text-lumiris-cyan',
                        )}
                    >
                        {AXIS_LABEL[r.axis]}
                    </Badge>
                    <span>{r.message}</span>
                </li>
            ))}
        </ul>
    );
}
