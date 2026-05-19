'use client';

import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    Beaker,
    BookmarkCheck,
    Check,
    History,
    Microscope,
    Search,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { computeScore, IRIS_THRESHOLDS } from '@lumiris/core/scoring';
import { mockAdminAuditLog, mockArtisans, mockPassports, mockRepairers } from '@lumiris/mock-data';
import type { AdminAuditLogEntry, Passport, IrisAxis, IrisGrade, ScoreResult } from '@lumiris/types';
import {
    IrisGrade as IrisGradeBadge,
    MissingFieldsBadge,
    PassportPhonePreview,
    ScoreBreakdown,
    ScoreCapWarning,
} from '@lumiris/scoring-ui';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@lumiris/ui/components/chart';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@lumiris/ui/components/command';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@lumiris/ui/components/hover-card';
import { Input } from '@lumiris/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Switch } from '@lumiris/ui/components/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { cn } from '@lumiris/ui/lib/cn';
import { useAdminAuditLog, useLogAction, usePermission } from '@/lib/auth';
import { applySimulatorChanges, type SimulatorChanges } from '@/lib/iris-simulator';
import { GovernanceBanner } from '../_shared/governance-banner';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';

const SCORING_NOW = new Date('2026-04-30T08:00:00Z');

const AXIS_LABEL: Record<IrisAxis, string> = {
    transparency: 'Transparence',
    craftsmanship: 'Savoir-faire',
    impact: 'Impact',
    repairability: 'Réparabilité',
};

function scorePassport(passport: Passport): ScoreResult {
    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
    return computeScore(passport, {
        certificates: passport.materials.flatMap((m) => m.certifications),
        ...(artisan ? { artisan } : {}),
        retoucheurs: mockRepairers,
        now: SCORING_NOW,
    });
}

function IrisWorkbenchComponent() {
    return <IrisWorkbenchInner />;
}

function IrisWorkbenchInner() {
    const [activeTab, setActiveTab] = useState('inspector');
    const [selectedId, setSelectedId] = useState<string>(mockPassports[0]?.id ?? '');

    const selected = mockPassports.find((p) => p.id === selectedId) ?? mockPassports[0];

    return (
        <div className="space-y-5">
            <div className="flex items-baseline justify-between gap-3">
                <div>
                    <h2 className="text-foreground text-xl font-semibold">Iris Workbench</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Inspecter, simuler, auditer le score Iris - outil interne, lecture seule.
                    </p>
                </div>
            </div>

            <NonNegotiableBanner rule="Outil de simulation uniquement. Aucun changement ici ne modifie le moteur de scoring @lumiris/core — les poids canoniques 40/25/25/10 restent figés." />

            <GovernanceBanner />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="inspector">Inspecteur</TabsTrigger>
                    <TabsTrigger value="simulator">Simulateur</TabsTrigger>
                    <TabsTrigger value="overrides">Corrections curateurs</TabsTrigger>
                    <TabsTrigger value="distribution">Distribution</TabsTrigger>
                </TabsList>

                <TabsContent value="inspector" className="space-y-5 pt-2">
                    <PassportPicker selectedId={selectedId} onSelect={setSelectedId} />
                    {selected ? <InspectorView passport={selected} /> : null}
                </TabsContent>
                <TabsContent value="simulator" className="space-y-5 pt-2">
                    <PassportPicker selectedId={selectedId} onSelect={setSelectedId} />
                    {selected ? <SimulatorView passport={selected} /> : null}
                </TabsContent>
                <TabsContent value="overrides" className="space-y-5 pt-2">
                    <OverridesView />
                </TabsContent>
                <TabsContent value="distribution" className="space-y-5 pt-2">
                    <DistributionView />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ─── Passport picker ────────────────────────────────────────────────────────

function PassportPicker({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
    const [search, setSearch] = useState('');
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return mockPassports.filter((p) => {
            if (!q) return true;
            const artisan = mockArtisans.find((a) => a.id === p.artisanId);
            const haystack =
                `${p.id} ${p.garment.reference} ${artisan?.atelierName ?? ''} ${p.garment.kind}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [search]);

    return (
        <div className="border-border bg-card rounded-xl border p-3">
            <div className="relative mb-2">
                <Search className="text-muted-foreground/60 absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Référence, artisan, ID passeport…"
                    className="pl-8"
                />
            </div>
            <div className="max-h-44 overflow-y-auto">
                <Command>
                    <CommandList className="max-h-44">
                        <CommandEmpty className="text-muted-foreground py-2 text-center text-xs">
                            Aucun passeport.
                        </CommandEmpty>
                        <CommandGroup>
                            {filtered.slice(0, 50).map((p) => {
                                const artisan = mockArtisans.find((a) => a.id === p.artisanId);
                                const isSelected = p.id === selectedId;
                                return (
                                    <CommandItem
                                        key={p.id}
                                        value={`${p.id} ${p.garment.reference} ${artisan?.atelierName}`}
                                        onSelect={() => onSelect(p.id)}
                                        className={cn('flex items-center gap-2', isSelected && 'bg-muted')}
                                    >
                                        <span className="text-foreground text-sm">{p.garment.reference}</span>
                                        <span className="text-muted-foreground text-[11px]">
                                            {artisan?.atelierName ?? p.artisanId}
                                        </span>
                                        <Badge variant="outline" className="ml-auto font-mono text-[10px]">
                                            {p.status}
                                        </Badge>
                                        {isSelected ? <Check className="text-lumiris-emerald h-3.5 w-3.5" /> : null}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </div>
        </div>
    );
}

// ─── Inspector ──────────────────────────────────────────────────────────────

function InspectorView({ passport }: { passport: Passport }) {
    const score = useMemo(() => scorePassport(passport), [passport]);
    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
                {score.cap?.applied ? <ScoreCapWarning cap={score.cap} /> : null}

                <div className="border-border bg-card rounded-xl border p-5">
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <p className="text-foreground text-sm font-semibold">
                            <Microscope className="text-lumiris-cyan mr-1.5 inline h-4 w-4" />
                            Breakdown 4 axes
                        </p>
                        <p className="text-muted-foreground font-mono text-xs">total {score.total.toFixed(1)} / 100</p>
                    </div>
                    <ScoreBreakdown breakdown={score.breakdown} weights={score.weights} />
                </div>

                <ContributionTable score={score} />

                {score.reasons.length > 0 ? (
                    <div className="border-border bg-card rounded-xl border p-5">
                        <p className="text-foreground mb-3 text-sm font-semibold">Justifications</p>
                        <ul className="space-y-1.5 text-xs">
                            {score.reasons.slice(0, 12).map((r, i) => (
                                <li key={i} className="text-muted-foreground inline-flex items-baseline gap-2">
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
                    </div>
                ) : null}
            </div>

            <div className="space-y-3">
                <PassportPhonePreview passport={passport} {...(artisan ? { artisan } : {})} score={score} />
                <div className="border-border bg-card rounded-xl border p-3 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Grade</span>
                        <IrisGradeBadge grade={score.grade} size="sm" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-muted-foreground">Plafonné</span>
                        <Badge
                            variant="outline"
                            className={cn(
                                'font-mono text-[10px]',
                                score.cap?.applied
                                    ? 'border-lumiris-rose/40 text-lumiris-rose'
                                    : 'border-lumiris-emerald/40 text-lumiris-emerald',
                            )}
                        >
                            {score.cap?.applied ? 'oui' : 'non'}
                        </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-muted-foreground">Champs manquants</span>
                        <MissingFieldsBadge passport={passport} showWhenComplete />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContributionTable({ score }: { score: ScoreResult }) {
    const rows: Array<{ axis: IrisAxis; raw: number; weight: number; weighted: number; reason: string }> = (
        ['transparency', 'craftsmanship', 'impact', 'repairability'] as const
    ).map((axis) => {
        const raw = score.breakdown[axis];
        const weight = score.weights[axis];
        const weighted = raw * weight;
        const reasonForAxis = score.reasons.find((r) => r.axis === axis);
        return {
            axis,
            raw,
            weight,
            weighted,
            reason: reasonForAxis?.message ?? '-',
        };
    });

    return (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
            <div className="border-border border-b px-4 py-2.5">
                <p className="text-foreground text-sm font-semibold">
                    <Activity className="text-lumiris-amber mr-1.5 inline h-4 w-4" /> Contributions par axe
                </p>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Axe</TableHead>
                        <TableHead className="text-right">Score brut</TableHead>
                        <TableHead className="text-right">Coefficient</TableHead>
                        <TableHead className="text-right">Score appliqué</TableHead>
                        <TableHead>Raison</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((r) => (
                        <TableRow key={r.axis}>
                            <TableCell>
                                <HoverCard openDelay={120}>
                                    <HoverCardTrigger asChild>
                                        <span className="text-foreground cursor-help text-sm font-medium">
                                            {AXIS_LABEL[r.axis]}
                                        </span>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-72 text-xs">
                                        <p className="text-foreground font-semibold">
                                            Coefficient appliqué : {(r.weight * 100).toFixed(0)} %
                                        </p>
                                        <p className="text-muted-foreground mt-1">
                                            Source : pondérations canoniques 40/25/25/10 - modifiable uniquement via PR
                                            sur <code className="bg-muted rounded px-1">@lumiris/core</code>.
                                        </p>
                                    </HoverCardContent>
                                </HoverCard>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{r.raw.toFixed(1)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                                {(r.weight * 100).toFixed(0)} %
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{r.weighted.toFixed(2)}</TableCell>
                            <TableCell className="text-muted-foreground text-[11px]">{r.reason}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

// ─── Simulator ──────────────────────────────────────────────────────────────

function SimulatorView({ passport }: { passport: Passport }) {
    const log = useLogAction();
    const { toast } = useToast();
    const [changes, setChanges] = useState<SimulatorChanges>({});

    const baseScore = useMemo(() => scorePassport(passport), [passport]);

    const simulated = useMemo<Passport>(() => {
        return applySimulatorChanges(passport, changes);
    }, [passport, changes]);

    const simulatedScore = useMemo(() => scorePassport(simulated), [simulated]);

    const totalDelta = simulatedScore.total - baseScore.total;
    const gradeDelta = baseScore.grade !== simulatedScore.grade;
    const affectedAxes = (['transparency', 'craftsmanship', 'impact', 'repairability'] as const).filter(
        (a) => Math.abs(simulatedScore.breakdown[a] - baseScore.breakdown[a]) > 0.05,
    );

    const handleSuggest = () => {
        log({
            action: 'artisan.contact',
            targetType: 'artisan',
            targetId: passport.artisanId,
            payload: {
                kind: 'workbench_suggestion',
                passportId: passport.id,
                changes,
                deltaTotal: +totalDelta.toFixed(1),
                fromGrade: baseScore.grade,
                toGrade: simulatedScore.grade,
            },
        });
        toast({
            title: 'Suggestion envoyée',
            description: `Le brouillon de message a été préparé pour l'artisan ${passport.artisanId}.`,
        });
    };

    const deltaWarning = Math.abs(totalDelta) > 50;

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-4">
                <div className="border-lumiris-amber/30 bg-lumiris-amber/5 rounded-xl border p-3 text-xs">
                    <p className="text-lumiris-amber inline-flex items-center gap-1.5 font-semibold">
                        <Beaker className="h-3.5 w-3.5" aria-hidden /> Mode simulation - aucun effet de bord
                    </p>
                    <p className="text-muted-foreground mt-1">
                        Le passeport en mémoire est modifié pour le calcul, jamais persisté.
                    </p>
                </div>

                {deltaWarning ? (
                    <div
                        role="alert"
                        className="border-lumiris-rose/30 bg-lumiris-rose/5 rounded-xl border p-3 text-xs"
                    >
                        <p className="text-lumiris-rose inline-flex items-center gap-1.5 font-semibold">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Delta {totalDelta.toFixed(1)} points
                        </p>
                        <p className="text-muted-foreground mt-1">
                            Ce paramétrage produirait une distribution incohérente — l&apos;export reste possible pour
                            analyse, mais aucun engagement plateforme.
                        </p>
                    </div>
                ) : null}

                <div className="border-border bg-card space-y-3 rounded-xl border p-4">
                    <p className="text-foreground text-sm font-semibold">Hypothèses</p>

                    <ToggleRow
                        label="Ajouter une certification GOTS valide à la première matière"
                        checked={changes.addGotsCertOnFiber === 0}
                        onCheckedChange={(v) => setChanges((c) => ({ ...c, addGotsCertOnFiber: v ? 0 : undefined }))}
                    />
                    <ToggleRow
                        label="Marquer toutes les certifications comme vérifiées"
                        checked={!!changes.markInvoiceVerified}
                        onCheckedChange={(v) => setChanges((c) => ({ ...c, markInvoiceVerified: v }))}
                    />
                    <ToggleRow
                        label="Ajouter une étape de fabrication (assembly)"
                        checked={!!changes.addProductionStep}
                        onCheckedChange={(v) => setChanges((c) => ({ ...c, addProductionStep: v }))}
                    />
                    <ToggleRow
                        label="Compléter les conseils d'entretien (lève le cap AGEC)"
                        checked={!!changes.fillCare}
                        onCheckedChange={(v) => setChanges((c) => ({ ...c, fillCare: v }))}
                    />
                </div>

                <Button size="sm" variant="outline" onClick={handleSuggest} className="w-full gap-1.5">
                    <BookmarkCheck className="h-3.5 w-3.5" /> Suggérer ces changements à l&apos;artisan
                </Button>
            </div>

            <div className="space-y-4">
                <div className="border-border bg-card rounded-xl border p-5">
                    <p className="text-foreground mb-3 text-sm font-semibold">Delta</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <DeltaTile
                            label="Score"
                            from={baseScore.total.toFixed(1)}
                            to={simulatedScore.total.toFixed(1)}
                            delta={totalDelta}
                            unit=""
                        />
                        <div className="border-border bg-background flex flex-col items-center justify-center rounded-lg border p-2">
                            <p className="text-muted-foreground text-[10px] uppercase">Grade</p>
                            <div className="mt-1 flex items-center gap-2">
                                <IrisGradeBadge grade={baseScore.grade} size="sm" />
                                <span className="text-muted-foreground">→</span>
                                <IrisGradeBadge grade={simulatedScore.grade} size="sm" />
                            </div>
                            {gradeDelta ? (
                                <Badge
                                    variant="outline"
                                    className="border-lumiris-emerald/40 text-lumiris-emerald mt-1.5 font-mono text-[10px]"
                                >
                                    +1
                                </Badge>
                            ) : null}
                        </div>
                        <DeltaTile
                            label="Cap appliqué"
                            from={baseScore.cap?.applied ? 'oui' : 'non'}
                            to={simulatedScore.cap?.applied ? 'oui' : 'non'}
                            delta={
                                Number(simulatedScore.cap?.applied ?? false) - Number(baseScore.cap?.applied ?? false)
                            }
                            unit=""
                            reverse
                        />
                    </div>
                </div>

                <div className="border-border bg-card rounded-xl border p-5">
                    <p className="text-foreground mb-3 text-sm font-semibold">Axes affectés</p>
                    {affectedAxes.length === 0 ? (
                        <p className="text-muted-foreground text-xs">
                            Aucune modification de score - activez une hypothèse à gauche.
                        </p>
                    ) : (
                        <ul className="space-y-2 text-xs">
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
                                                className={cn(delta > 0 ? 'text-lumiris-emerald' : 'text-lumiris-rose')}
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

                <div className="border-border bg-card rounded-xl border p-5">
                    <p className="text-foreground mb-3 text-sm font-semibold">Aperçu simulé</p>
                    <div className="origin-top scale-90">
                        <PassportPhonePreview passport={simulated} score={simulatedScore} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToggleRow({
    label,
    checked,
    onCheckedChange,
}: {
    label: string;
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3 text-xs">
            <span className="text-foreground flex-1">{label}</span>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </label>
    );
}

function DeltaTile({
    label,
    from,
    to,
    delta,
    unit,
    reverse,
}: {
    label: string;
    from: string;
    to: string;
    delta: number;
    unit: string;
    reverse?: boolean;
}) {
    const positive = reverse ? delta < 0 : delta > 0;
    const negative = reverse ? delta > 0 : delta < 0;
    const tone = positive ? 'text-lumiris-emerald' : negative ? 'text-lumiris-rose' : 'text-muted-foreground';
    return (
        <div className="border-border bg-background flex flex-col items-center rounded-lg border p-2">
            <p className="text-muted-foreground text-[10px] uppercase">{label}</p>
            <p className="text-foreground mt-1 font-mono text-xs">
                {from}
                {unit}
            </p>
            <p className={cn('font-mono text-sm font-bold', tone)}>
                {to}
                {unit}
            </p>
        </div>
    );
}

// ─── Overrides historiques ──────────────────────────────────────────────────

function OverridesView() {
    const liveLog = useAdminAuditLog();
    const canOverrideScore = usePermission('passport.override');
    const canReadAuditLog = usePermission('governance.read_audit_log');
    const canViewOverrides = canOverrideScore || canReadAuditLog;

    const [periodFilter, setPeriodFilter] = useState<'30d' | '90d' | '1y' | 'all'>('all');
    const [actorFilter, setActorFilter] = useState<string>('all');
    const [magnitudeFilter, setMagnitudeFilter] = useState<'all' | 'big'>('all');

    const overrides = useMemo<readonly AdminAuditLogEntry[]>(() => {
        const allEntries = [...liveLog, ...mockAdminAuditLog];
        const seen = new Set<string>();
        const dedup = allEntries.filter((e) => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return e.action === 'passport.override';
        });
        return dedup;
    }, [liveLog]);

    const actorIds = useMemo(() => Array.from(new Set(overrides.map((e) => e.actorId))).sort(), [overrides]);

    const filtered = useMemo(() => {
        const now = Date.now();
        const cutoff =
            periodFilter === '30d'
                ? 30 * 86_400_000
                : periodFilter === '90d'
                  ? 90 * 86_400_000
                  : periodFilter === '1y'
                    ? 365 * 86_400_000
                    : Number.POSITIVE_INFINITY;

        const GRADE_RANK: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };

        return overrides.filter((e) => {
            if (now - new Date(e.ts).getTime() > cutoff) return false;
            if (actorFilter !== 'all' && e.actorId !== actorFilter) return false;
            if (magnitudeFilter === 'big') {
                const from = (e.payload.from as string | undefined) ?? '';
                const to = (e.payload.to as string | undefined) ?? '';
                const delta = (GRADE_RANK[to] ?? 0) - (GRADE_RANK[from] ?? 0);
                if (Math.abs(delta) < 2) return false;
            }
            return true;
        });
    }, [overrides, periodFilter, actorFilter, magnitudeFilter]);

    if (!canViewOverrides) {
        return (
            <div className="border-border bg-muted/30 text-muted-foreground rounded-xl border p-6 text-sm">
                Section restreinte - réservée aux rôles disposant de la permission{' '}
                <code className="bg-muted rounded px-1">passport.override</code> ou{' '}
                <code className="bg-muted rounded px-1">governance.read_audit_log</code>.
            </div>
        );
    }

    return (
        <>
            <div className="border-lumiris-cyan/30 bg-lumiris-cyan/5 rounded-xl border p-4 text-xs">
                <p className="text-lumiris-cyan inline-flex items-center gap-1.5 font-semibold">
                    <History className="h-3.5 w-3.5" /> Trace immuable des overrides
                </p>
                <p className="text-muted-foreground mt-1.5">
                    Cette table est l&apos;empreinte de la règle&nbsp;:{' '}
                    <strong>personne n&apos;achète son score</strong>. Si elle est anormalement remplie, ou présente des
                    sauts de grade non motivés, c&apos;est un signal de gouvernance.
                </p>
            </div>

            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="30d">30 jours</SelectItem>
                        <SelectItem value="90d">90 jours</SelectItem>
                        <SelectItem value="1y">1 an</SelectItem>
                        <SelectItem value="all">Tout</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={actorFilter} onValueChange={setActorFilter}>
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous curateurs</SelectItem>
                        {actorIds.map((a) => (
                            <SelectItem key={a} value={a}>
                                {a}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={magnitudeFilter} onValueChange={(v) => setMagnitudeFilter(v as typeof magnitudeFilter)}>
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes amplitudes</SelectItem>
                        <SelectItem value="big">≥ 2 grades</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-muted-foreground ml-auto text-[11px]">{filtered.length} entrées</p>
            </div>

            <div className="border-border bg-card overflow-hidden rounded-xl border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Curateur</TableHead>
                            <TableHead>Passeport</TableHead>
                            <TableHead>Avant → après</TableHead>
                            <TableHead>Raison</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((e) => (
                            <TableRow key={e.id}>
                                <TableCell className="font-mono text-[11px]">
                                    {new Date(e.ts).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </TableCell>
                                <TableCell>
                                    <span className="text-foreground text-sm">{e.actorId}</span>
                                    <span className="text-muted-foreground ml-1 font-mono text-[10px]">
                                        ({e.actorRole})
                                    </span>
                                </TableCell>
                                <TableCell className="font-mono text-[11px]">{e.targetId}</TableCell>
                                <TableCell>
                                    <span className="font-mono text-sm">
                                        {String(e.payload.from)} →{' '}
                                        <strong className="text-lumiris-amber">{String(e.payload.to)}</strong>
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-[11px]">
                                    {String(e.payload.reason ?? '-')}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-xs">
                                    Aucun override sur la période - c&apos;est plutôt sain.
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}

// ─── Distribution ───────────────────────────────────────────────────────────

function DistributionView() {
    const data = useMemo(() => {
        const published = mockPassports.filter((p) => p.status === 'Published');
        const scores = published.map((p) => scorePassport(p));
        const grades: Record<IrisGrade, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
        for (const s of scores) grades[s.grade]++;
        const cappedCount = scores.filter((s) => s.cap?.applied).length;
        const recent = scores.slice(0, 30);
        const recentAShare = recent.length === 0 ? 0 : recent.filter((s) => s.grade === 'A').length / recent.length;
        const driftAlert = recentAShare > 0.5;
        const avg6Months = [
            { label: 'nov', avg: 56 },
            { label: 'déc', avg: 58 },
            { label: 'janv', avg: 60 },
            { label: 'févr', avg: 62 },
            { label: 'mars', avg: 64 },
            { label: 'avr', avg: scores.length === 0 ? 60 : scores.reduce((s, x) => s + x.total, 0) / scores.length },
        ];
        const totalScored = scores.length;
        return { grades, cappedCount, recentAShare, driftAlert, avg6Months, totalScored };
    }, []);

    const histo = (['A', 'B', 'C', 'D', 'E'] as const).map((g) => ({ grade: g, count: data.grades[g] }));
    const histoConfig = { count: { label: 'Passeports', color: 'var(--lumiris-emerald)' } } satisfies ChartConfig;
    const lineConfig = { avg: { label: 'Moyenne Iris', color: 'var(--lumiris-cyan)' } } satisfies ChartConfig;

    return (
        <>
            {data.driftAlert ? (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-lumiris-amber/30 bg-lumiris-amber/5 rounded-xl border p-4 text-xs"
                >
                    <p className="text-lumiris-amber inline-flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="h-3.5 w-3.5" /> Distribution anormalement haute
                    </p>
                    <p className="text-muted-foreground mt-1">
                        {(data.recentAShare * 100).toFixed(0)} % des 30 derniers passeports validés sont en A. Vérifier
                        la rigueur de curation - seuils canoniques A {IRIS_THRESHOLDS.A} / B {IRIS_THRESHOLDS.B} / C{' '}
                        {IRIS_THRESHOLDS.C} / D {IRIS_THRESHOLDS.D}.
                    </p>
                </motion.div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {(['A', 'B', 'C', 'D', 'E'] as const).map((g) => (
                    <div key={g} className="border-border bg-card flex items-center gap-3 rounded-xl border p-4">
                        <IrisGradeBadge grade={g} size="md" />
                        <div>
                            <p className="text-muted-foreground text-[10px] uppercase">{g}</p>
                            <p className="text-foreground font-mono text-2xl font-bold">{data.grades[g]}</p>
                        </div>
                    </div>
                ))}
                <div className="border-border bg-card flex items-center gap-3 rounded-xl border p-4">
                    <div className="bg-lumiris-rose/10 text-lumiris-rose flex h-10 w-10 items-center justify-center rounded-xl">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-muted-foreground text-[10px] uppercase">Cappés</p>
                        <p className="text-foreground font-mono text-2xl font-bold">{data.cappedCount}</p>
                        <p className="text-muted-foreground text-[10px]">sur {data.totalScored} publiés</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="border-border bg-card rounded-xl border p-4">
                    <p className="text-foreground mb-3 text-sm font-medium">Distribution des grades</p>
                    <ChartContainer config={histoConfig} className="h-56 w-full">
                        <BarChart data={histo}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="grade" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </div>
                <div className="border-border bg-card rounded-xl border p-4">
                    <p className="text-foreground mb-3 text-sm font-medium">
                        <TrendingUp className="text-lumiris-cyan mr-1.5 inline h-3.5 w-3.5" />
                        Moyenne Iris - 6 mois
                    </p>
                    <ChartContainer config={lineConfig} className="h-56 w-full">
                        <BarChart data={data.avg6Months}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} />
                            <YAxis domain={[40, 80]} tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="avg" fill="var(--color-avg)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </div>
            </div>
        </>
    );
}

export const IrisWorkbench = memo(IrisWorkbenchComponent);
