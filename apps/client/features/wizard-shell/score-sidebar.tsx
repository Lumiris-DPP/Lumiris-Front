'use client';

import { AlertTriangle, ListChecks, X } from 'lucide-react';
import { AGEC_REQUIRED_FIELDS, ESPR_REQUIRED_FIELDS } from '@lumiris/core/scoring';
import type { Passport, ScoreResult } from '@lumiris/types';
import { IrisGrade, ScoreBreakdown } from '@lumiris/scoring-ui';
import { Alert, AlertDescription } from '@lumiris/ui/components/alert';
import { Card, CardContent } from '@lumiris/ui/components/card';

const MAX_VISIBLE_MISSING = 3;

interface ScoreSidebarProps {
    passport: Passport;
    score: ScoreResult;
}

export function ScoreSidebar({ passport, score }: ScoreSidebarProps) {
    const missing = listMissing(passport);
    const visible = missing.slice(0, MAX_VISIBLE_MISSING);
    const extra = missing.length - visible.length;

    return (
        <>
            <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
                <Card>
                    <CardContent className="space-y-4 p-4">
                        <ScoreHeader score={score} />
                        <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                        {score.cap?.applied && <SidebarCapAlert reason={score.cap.reason} />}
                        {missing.length > 0 && <MissingList visible={visible} extra={extra} total={missing.length} />}
                    </CardContent>
                </Card>
            </aside>
            <MobileScoreStrip score={score} missingCount={missing.length} />
        </>
    );
}

function ScoreHeader({ score }: { score: ScoreResult }) {
    return (
        <div className="flex items-center gap-3">
            <IrisGrade grade={score.grade} size="lg" />
            <div>
                <p className="text-foreground font-mono text-2xl font-semibold leading-none">
                    {score.total.toFixed(1)}
                    <span className="text-muted-foreground/70 ml-0.5 text-sm font-normal">/ 100</span>
                </p>
                <p className="text-muted-foreground mt-1 text-[11px]">Score Iris provisoire</p>
            </div>
        </div>
    );
}

function SidebarCapAlert({ reason }: { reason?: string }) {
    return (
        <Alert className="border-iris-grade-d/30 bg-iris-grade-d/5 [&>svg]:text-iris-grade-d py-2">
            <AlertTriangle aria-hidden />
            <AlertDescription className="text-iris-grade-d text-[11px]">
                Plafonné à D — {reason ?? 'champ obligatoire manquant'}
            </AlertDescription>
        </Alert>
    );
}

function MissingList({
    visible,
    extra,
    total,
}: {
    visible: ReadonlyArray<{ kind: 'ESPR' | 'AGEC'; path: string }>;
    extra: number;
    total: number;
}) {
    return (
        <div className="space-y-1.5 border-t pt-3">
            <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider">
                <ListChecks className="h-3 w-3" />
                Champs manquants ({total})
            </p>
            <ul className="space-y-0.5">
                {visible.map((m) => (
                    <li
                        key={`${m.kind}::${m.path}`}
                        className="text-foreground/80 flex items-start gap-1.5 text-[11px]"
                    >
                        <X className="text-lumiris-amber mt-0.5 h-2.5 w-2.5 shrink-0" />
                        <span className="font-mono">
                            <span className="text-muted-foreground">{m.kind}</span> · {m.path}
                        </span>
                    </li>
                ))}
            </ul>
            {extra > 0 && (
                <p className="text-muted-foreground text-[11px]">
                    + {extra} autre{extra > 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
}

function MobileScoreStrip({ score, missingCount }: { score: ScoreResult; missingCount: number }) {
    return (
        <div className="border-border bg-card flex items-center justify-between gap-3 rounded-lg border px-3 py-2 lg:hidden">
            <div className="flex items-center gap-2">
                <IrisGrade grade={score.grade} size="md" />
                <p className="text-foreground font-mono text-sm font-semibold">
                    {score.total.toFixed(1)}
                    <span className="text-muted-foreground/70 ml-0.5 text-xs font-normal">/ 100</span>
                </p>
            </div>
            {missingCount > 0 ? (
                <p className="text-lumiris-amber text-[11px]">
                    {missingCount} champ{missingCount > 1 ? 's' : ''} manquant{missingCount > 1 ? 's' : ''}
                </p>
            ) : (
                <p className="text-lumiris-emerald text-[11px]">Complet</p>
            )}
        </div>
    );
}

function listMissing(passport: Passport): Array<{ kind: 'ESPR' | 'AGEC'; path: string }> {
    return [
        ...ESPR_REQUIRED_FIELDS.filter((f) => !f.isPresent(passport)).map((f) => ({
            kind: 'ESPR' as const,
            path: f.path,
        })),
        ...AGEC_REQUIRED_FIELDS.filter((f) => !f.isPresent(passport)).map((f) => ({
            kind: 'AGEC' as const,
            path: f.path,
        })),
    ];
}
