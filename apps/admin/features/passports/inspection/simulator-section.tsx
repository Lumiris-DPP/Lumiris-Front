'use client';

import { useEffect, useMemo, useState } from 'react';
import { Beaker, Eye, Info, RotateCcw, Wand2 } from 'lucide-react';
import { mockArtisans } from '@lumiris/mock-data';
import type { IrisAxis, Passport, ScoreResult } from '@lumiris/types';
import { IrisGrade, PassportPhonePreview } from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { Switch } from '@lumiris/ui/components/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction } from '@/lib/auth';
import { applySimulatorChanges, type SimulatorChanges } from '@/lib/iris-simulator';
import { scorePassport } from './scoring';
import { AXIS_LABEL } from './types';

interface SimulatorSectionProps {
    passport: Passport;
    baseScore: ScoreResult;
}

const AXES: readonly IrisAxis[] = ['transparency', 'craftsmanship', 'impact', 'repairability'];

interface ToggleSpec {
    key: keyof SimulatorChanges;
    label: string;
    description: string;
    apply: (c: SimulatorChanges, on: boolean) => SimulatorChanges;
    isOn: (c: SimulatorChanges) => boolean;
}

const TOGGLES: readonly ToggleSpec[] = [
    {
        key: 'addGotsCertOnFiber',
        label: 'Certif GOTS',
        description: 'Ajoute une certif GOTS à la 1ʳᵉ fibre.',
        apply: (c, on) => ({ ...c, addGotsCertOnFiber: on ? 0 : undefined }),
        isOn: (c) => c.addGotsCertOnFiber === 0,
    },
    {
        key: 'markInvoiceVerified',
        label: 'Certifs vérifiées',
        description: 'Marque toutes les certifs comme vérifiées.',
        apply: (c, on) => ({ ...c, markInvoiceVerified: on }),
        isOn: (c) => !!c.markInvoiceVerified,
    },
    {
        key: 'addProductionStep',
        label: 'Étape assembly',
        description: "Ajoute une étape 'assembly'.",
        apply: (c, on) => ({ ...c, addProductionStep: on }),
        isOn: (c) => !!c.addProductionStep,
    },
    {
        key: 'fillCare',
        label: 'Conseils entretien',
        description: 'Renseigne lavage / séchage / repassage / stockage. Lève le cap AGEC.',
        apply: (c, on) => ({ ...c, fillCare: on }),
        isOn: (c) => !!c.fillCare,
    },
];

export function SimulatorSection({ passport, baseScore }: SimulatorSectionProps) {
    const log = useLogAction();
    const { toast } = useToast();
    const [changes, setChanges] = useState<SimulatorChanges>({});
    const [debouncedChanges, setDebouncedChanges] = useState<SimulatorChanges>({});
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        const handle = setTimeout(() => setDebouncedChanges(changes), 300);
        return () => clearTimeout(handle);
    }, [changes]);

    const simulated = useMemo(() => applySimulatorChanges(passport, debouncedChanges), [passport, debouncedChanges]);
    const simulatedScore = useMemo(() => scorePassport(simulated), [simulated]);

    const totalDelta = simulatedScore.total - baseScore.total;
    const gradeChanged = baseScore.grade !== simulatedScore.grade;
    const affectedAxes = AXES.filter((a) => Math.abs(simulatedScore.breakdown[a] - baseScore.breakdown[a]) > 0.05);
    const hasChanges = Object.values(changes).some((v) => v !== undefined && v !== false);
    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);

    const handleApply = () => {
        const finalPassport = applySimulatorChanges(passport, changes);
        const finalScore = scorePassport(finalPassport);
        log({
            action: 'artisan.contact',
            targetType: 'artisan',
            targetId: passport.artisanId,
            payload: {
                kind: 'workbench_suggestion',
                passportId: passport.id,
                changes,
                deltaTotal: +(finalScore.total - baseScore.total).toFixed(1),
                fromGrade: baseScore.grade,
                toGrade: finalScore.grade,
            },
        });
        toast({
            title: 'Simulation transmise',
            description: `Suggestion envoyée à l'artisan ${passport.artisanId}.`,
        });
    };

    return (
        <section className="space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-foreground inline-flex items-center gap-2 text-base font-semibold">
                    <Beaker className="text-lumiris-amber h-4 w-4" />
                    Simulateur
                </h2>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setChanges({})}
                        disabled={!hasChanges}
                        className="gap-1.5"
                    >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewOpen(true)}
                        disabled={!hasChanges}
                        className="gap-1.5"
                    >
                        <Eye className="h-3.5 w-3.5" /> Aperçu
                    </Button>
                    <Button size="sm" onClick={handleApply} disabled={!hasChanges} className="gap-1.5">
                        <Wand2 className="h-3.5 w-3.5" /> Suggérer
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="border-border bg-card space-y-3 rounded-xl border p-5">
                    <p className="text-foreground text-sm font-semibold">Hypothèses</p>
                    {TOGGLES.map((t) => (
                        <div key={t.key} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="text-foreground">{t.label}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            className="text-muted-foreground hover:text-foreground"
                                            aria-label={`Détail · ${t.label}`}
                                        >
                                            <Info className="h-3 w-3" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        {t.description}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Switch
                                checked={t.isOn(changes)}
                                onCheckedChange={(v) => setChanges((c) => t.apply(c, v))}
                                aria-label={t.label}
                            />
                        </div>
                    ))}
                </div>

                <div className="border-border bg-card rounded-xl border p-5">
                    <p className="text-foreground mb-3 text-sm font-semibold">Delta</p>
                    <div className="grid grid-cols-2 gap-3">
                        <GradeTile label="Actuel" grade={baseScore.grade} total={baseScore.total} />
                        <GradeTile
                            label="Simulé"
                            grade={simulatedScore.grade}
                            total={simulatedScore.total}
                            delta={totalDelta}
                            highlight={gradeChanged}
                        />
                    </div>

                    <div className="mt-4">
                        <p className="text-muted-foreground mb-2 text-[11px] uppercase">Axes affectés</p>
                        {affectedAxes.length === 0 ? (
                            <p className="text-muted-foreground text-xs">
                                Aucune modification — activez une hypothèse.
                            </p>
                        ) : (
                            <ul className="space-y-1.5 text-xs">
                                {affectedAxes.map((axis) => {
                                    const before = baseScore.breakdown[axis];
                                    const after = simulatedScore.breakdown[axis];
                                    const delta = after - before;
                                    return (
                                        <li key={axis} className="flex items-center justify-between">
                                            <span className="text-foreground">{AXIS_LABEL[axis]}</span>
                                            <span className="font-mono">
                                                {before.toFixed(1)} →{' '}
                                                <span
                                                    className={cn(
                                                        delta > 0 ? 'text-lumiris-emerald' : 'text-lumiris-rose',
                                                    )}
                                                >
                                                    {after.toFixed(1)}
                                                </span>{' '}
                                                <span className="text-muted-foreground">
                                                    ({delta > 0 ? '+' : ''}
                                                    {delta.toFixed(1)})
                                                </span>
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
                <SheetContent className="w-160 sm:max-w-160 max-w-[95vw]" side="right">
                    <SheetHeader>
                        <SheetTitle>Aperçu</SheetTitle>
                        <SheetDescription>Rendu DPP avec hypothèses.</SheetDescription>
                    </SheetHeader>
                    <div className="grid grid-cols-2 gap-4 overflow-y-auto p-4">
                        <PreviewColumn label="Actuel" passport={passport} score={baseScore} artisan={artisan} />
                        <PreviewColumn label="Simulé" passport={simulated} score={simulatedScore} artisan={artisan} />
                    </div>
                </SheetContent>
            </Sheet>
        </section>
    );
}

function GradeTile({
    label,
    grade,
    total,
    delta,
    highlight,
}: {
    label: string;
    grade: ScoreResult['grade'];
    total: number;
    delta?: number;
    highlight?: boolean;
}) {
    const deltaTone =
        delta === undefined
            ? 'text-muted-foreground'
            : delta > 0
              ? 'text-lumiris-emerald'
              : delta < 0
                ? 'text-lumiris-rose'
                : 'text-muted-foreground';
    return (
        <div
            className={cn(
                'border-border bg-background flex flex-col items-center gap-1.5 rounded-lg border p-3',
                highlight && 'border-lumiris-emerald/40',
            )}
        >
            <p className="text-muted-foreground text-[10px] uppercase">{label}</p>
            <IrisGrade grade={grade} size="lg" shape="square" />
            <p className="text-foreground font-mono text-sm">{total.toFixed(1)}</p>
            {delta !== undefined ? (
                <Badge variant="outline" className={cn('font-mono text-[10px]', deltaTone)}>
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(1)}
                </Badge>
            ) : null}
        </div>
    );
}

function PreviewColumn({
    label,
    passport,
    score,
    artisan,
}: {
    label: string;
    passport: Passport;
    score: ScoreResult;
    artisan: ReturnType<typeof mockArtisans.find>;
}) {
    return (
        <div className="space-y-2">
            <p className="text-muted-foreground text-center text-[11px] uppercase">{label}</p>
            <div className="origin-top scale-90">
                <PassportPhonePreview passport={passport} {...(artisan ? { artisan } : {})} score={score} />
            </div>
        </div>
    );
}
