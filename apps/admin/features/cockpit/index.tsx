'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { AlertCircle, ArrowRight, BarChart3, Coins, FileText, Sparkles, Store, Timer } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, XAxis, YAxis } from 'recharts';
import { mockAdminAuditLog, mockArtisans, mockPassports, mockSubscriptions } from '@lumiris/mock-data';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@lumiris/ui/components/chart';
import { Switch } from '@lumiris/ui/components/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { cn } from '@lumiris/ui/lib/cn';
import { useAdminAuditLog } from '@/lib/auth';
import { IRIS_AVERAGE_TARGET } from '@/lib/business-targets';
import {
    buildAcquisitionFunnel,
    buildArtisanKpi,
    buildCurationKpi,
    buildEsprCountdown,
    buildIrisKpi,
    buildLtvCacRows,
    buildMrrKpi,
    buildTrajectory,
    type LtvCacRow,
} from '@/lib/cockpit-metrics';
import { EmptyState } from '../_shared/empty-state';
import { LoadingState } from '../_shared/loading-state';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';

// Aligné sur les fixtures (`ts(0, …)` dans admin-audit-log.ts) pour rendre les KPI déterministes en CI.
const COCKPIT_NOW = new Date('2026-05-17T08:00:00Z');

const containerAnim: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemAnim: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const eur = (value: number, fractionDigits = 0): string =>
    new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: 0,
    }).format(value);

const eurCompact = (value: number): string => {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M€`;
    if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)} k€`;
    return `${Math.round(value)} €`;
};

function CockpitComponent() {
    const auditLog = useAdminAuditLog();
    const [stress, setStress] = useState(false);
    const [trajectoryReady, setTrajectoryReady] = useState(false);
    useEffect(() => {
        let alive = true;
        const handle = setTimeout(() => {
            if (alive) setTrajectoryReady(true);
        }, 450);
        return () => {
            alive = false;
            clearTimeout(handle);
        };
    }, []);

    const artisanKpi = useMemo(() => buildArtisanKpi(mockArtisans, mockAdminAuditLog, COCKPIT_NOW), []);
    const curationKpi = useMemo(() => buildCurationKpi(mockPassports), []);
    const irisKpi = useMemo(() => buildIrisKpi(mockPassports, mockArtisans, COCKPIT_NOW, IRIS_AVERAGE_TARGET), []);
    const mrrKpi = useMemo(() => buildMrrKpi(mockSubscriptions), []);
    const trajectory = useMemo(() => buildTrajectory(stress), [stress]);
    const ltvCacRows = useMemo(() => buildLtvCacRows(), []);
    const funnel = useMemo(() => buildAcquisitionFunnel(COCKPIT_NOW), []);
    const countdown = useMemo(() => buildEsprCountdown(COCKPIT_NOW), []);

    const noArtisans = artisanKpi.total === 0;
    const noQueue = curationKpi.pendingCount + curationKpi.draftCount + curationKpi.inCompletionCount === 0;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-foreground text-balance text-xl font-semibold">
                    Cockpit business — chiffrage v4.2.
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Trajectoire ARR · LTV/CAC par segment · entonnoir ATELIER · décompte ESPR. Toutes les valeurs
                    commerciales viennent de <span className="text-foreground font-mono">business-targets.ts</span>.
                </p>
            </div>

            <NonNegotiableBanner rule="Lecture seule. Le cockpit consolide MRR, ARR et activité sans jamais déclencher de mutation côté facturation ni de modification du moteur de scoring." />

            {noArtisans ? (
                <EmptyState
                    icon={Store}
                    title="Aucun artisan inscrit"
                    description="L'onboarding ATELIER est ouvert mais aucun atelier n'a finalisé son inscription."
                    action={
                        <Button asChild size="sm" variant="outline">
                            <a href="/artisans">Ouvrir l&apos;annuaire artisans</a>
                        </Button>
                    }
                />
            ) : null}

            {noQueue ? (
                <EmptyState
                    icon={FileText}
                    title="Aucun passeport en file"
                    description="La cadence reprendra à la prochaine soumission - prochaine attente dans la journée si le rythme se maintient."
                    action={
                        <Button asChild size="sm" variant="outline">
                            <a href="/passeports">Ouvrir la file de curation</a>
                        </Button>
                    }
                />
            ) : null}

            <KpiHeader artisanKpi={artisanKpi} curationKpi={curationKpi} irisKpi={irisKpi} mrrKpi={mrrKpi} />

            {trajectoryReady ? (
                <TrajectoryCard stress={stress} onStressChange={setStress} data={trajectory} />
            ) : (
                <div className="border-border bg-card rounded-xl border p-5">
                    <p className="text-foreground mb-3 text-sm font-semibold">Trajectoire ARR vs charges</p>
                    <LoadingState rows={6} label="Projection ARR en cours de calcul" />
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <LtvCacCard rows={ltvCacRows} />
                <FunnelCard funnel={funnel} />
            </div>

            <EsprCountdown entries={countdown} />

            <CurationActivity auditLog={auditLog} />
        </div>
    );
}

interface KpiHeaderProps {
    artisanKpi: ReturnType<typeof buildArtisanKpi>;
    curationKpi: ReturnType<typeof buildCurationKpi>;
    irisKpi: ReturnType<typeof buildIrisKpi>;
    mrrKpi: ReturnType<typeof buildMrrKpi>;
}

function KpiHeader({ artisanKpi, curationKpi, irisKpi, mrrKpi }: KpiHeaderProps) {
    const medianLabel =
        curationKpi.medianValidationDays === null
            ? 'Aucun passeport validé'
            : `Médiane validation : ${curationKpi.medianValidationDays.toFixed(1)} j`;
    const deltaSign = irisKpi.deltaVsTarget >= 0 ? '+' : '−';
    const deltaLabel =
        irisKpi.sampleSize === 0
            ? `Cible ${IRIS_AVERAGE_TARGET.toFixed(1)}/5`
            : `${deltaSign}${Math.abs(irisKpi.deltaVsTarget).toFixed(2)} vs cible ${IRIS_AVERAGE_TARGET.toFixed(1)}/5`;

    const silos = [
        {
            key: 'artisans',
            label: 'Artisans actifs',
            icon: Store,
            value: `${artisanKpi.total}`,
            subLabel: `${artisanKpi.splitByTier.Solo} Solo · ${artisanKpi.splitByTier.Studio} Studio · ${artisanKpi.splitByTier.Maison} Maison`,
            accentClass: 'text-lumiris-emerald',
            bgClass: 'bg-lumiris-emerald/8',
            borderClass: 'border-lumiris-emerald/15',
            trend: `Attrition 30 j : ${artisanKpi.churn30d}`,
            trendUp: artisanKpi.churn30d === 0,
            ariaLabel: `Artisans actifs ${artisanKpi.total}. ${artisanKpi.splitByTier.Solo} Solo, ${artisanKpi.splitByTier.Studio} Studio, ${artisanKpi.splitByTier.Maison} Maison. ${artisanKpi.churn30d} attrition sur 30 jours.`,
        },
        {
            key: 'curation',
            label: 'File de curation',
            icon: FileText,
            value: `${curationKpi.pendingCount}`,
            subLabel: `${curationKpi.draftCount} brouillon(s) · ${curationKpi.inCompletionCount} en complétion`,
            accentClass: 'text-lumiris-amber',
            bgClass: 'bg-lumiris-amber/8',
            borderClass: 'border-lumiris-amber/15',
            trend: medianLabel,
            trendUp: (curationKpi.medianValidationDays ?? 0) < 7,
            ariaLabel: `File de curation ${curationKpi.pendingCount} en attente. ${curationKpi.draftCount} brouillons et ${curationKpi.inCompletionCount} en complétion. ${medianLabel}.`,
        },
        {
            key: 'iris',
            label: 'Score Iris moyen',
            icon: Sparkles,
            value: irisKpi.sampleSize === 0 ? '—' : irisKpi.avgOnFive.toFixed(2),
            subLabel:
                irisKpi.sampleSize === 0
                    ? 'Aucun passeport publié'
                    : `Grade dominant ${irisKpi.dominantGrade} · ${irisKpi.cappedCount} plafonnés D`,
            accentClass: 'text-lumiris-cyan',
            bgClass: 'bg-lumiris-cyan/8',
            borderClass: 'border-lumiris-cyan/15',
            trend: deltaLabel,
            trendUp: irisKpi.deltaVsTarget >= 0,
            ariaLabel:
                irisKpi.sampleSize === 0
                    ? `Score Iris moyen indisponible. Aucun passeport publié.`
                    : `Score Iris moyen ${irisKpi.avgOnFive.toFixed(2)} sur 5. Grade dominant ${irisKpi.dominantGrade}. ${irisKpi.cappedCount} passeports plafonnés D. ${deltaLabel}.`,
        },
        {
            key: 'mrr',
            label: 'MRR consolidé',
            icon: Coins,
            value: eurCompact(mrrKpi.mrrTotal),
            subLabel: `ARR projeté ${eurCompact(mrrKpi.arrTotal)}`,
            accentClass: 'text-lumiris-orange',
            bgClass: 'bg-lumiris-orange/8',
            borderClass: 'border-lumiris-orange/15',
            trend: `ATELIER ${eurCompact(mrrKpi.atelierMrr)} · +${eurCompact(mrrKpi.plusMrr)} · Local ${eurCompact(mrrKpi.localMrr)}`,
            trendUp: true,
            ariaLabel: `MRR consolidé ${eurCompact(mrrKpi.mrrTotal)}. ARR projeté ${eurCompact(mrrKpi.arrTotal)} sur 12 mois.`,
        },
    ];

    return (
        <motion.div
            variants={containerAnim}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
            {silos.map((silo) => (
                <motion.div
                    key={silo.key}
                    variants={itemAnim}
                    role="group"
                    aria-label={silo.ariaLabel}
                    tabIndex={0}
                    className={cn(
                        'opal-shadow bg-card focus-visible:ring-ring focus-visible:ring-offset-background flex flex-col rounded-xl border p-5 outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        silo.borderClass,
                    )}
                >
                    <div className={cn('w-fit rounded-lg p-2', silo.bgClass)}>
                        <silo.icon className={cn('h-[18px] w-[18px]', silo.accentClass)} aria-hidden />
                    </div>
                    <div className="mt-4">
                        <span className={cn('font-mono text-3xl font-bold tracking-tight', silo.accentClass)}>
                            {silo.value}
                        </span>
                        <p className="text-muted-foreground mt-0.5 text-xs">{silo.subLabel}</p>
                    </div>
                    <p
                        className={cn(
                            'mt-3 text-[11px]',
                            silo.trendUp ? 'text-lumiris-emerald' : 'text-muted-foreground',
                        )}
                    >
                        {silo.trend}
                    </p>
                    <p className="text-foreground mt-auto pt-3 text-[13px] font-medium">{silo.label}</p>
                </motion.div>
            ))}
        </motion.div>
    );
}

interface TrajectoryCardProps {
    stress: boolean;
    onStressChange: (next: boolean) => void;
    data: ReturnType<typeof buildTrajectory>;
}

const TRAJECTORY_CONFIG = {
    arrAtelier: { label: 'ATELIER (B2B)', color: 'var(--lumiris-emerald)' },
    arrAffiliation: { label: 'Affiliation B2C', color: 'var(--lumiris-cyan)' },
    arrLocal: { label: 'LUMIRIS Local', color: 'var(--lumiris-orange)' },
    chargesAnnualized: { label: 'Charges annualisées', color: 'var(--lumiris-rose)' },
} satisfies ChartConfig;

function TrajectoryCard({ stress, onStressChange, data }: TrajectoryCardProps) {
    const [breakevenStart, breakevenEnd] = data.breakevenRange;
    return (
        <div className="opal-shadow border-border bg-card rounded-xl border">
            <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
                <div>
                    <h3 className="text-foreground text-sm font-semibold">Trajectoire ARR vs charges</h3>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        ATELIER · Affiliation B2C · Local · charges annualisées · point mort M{breakevenStart}–M
                        {breakevenEnd}.
                    </p>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <label htmlFor="cockpit-stress-toggle">Stress-test (−30 % B2B, −33 % B2C)</label>
                    <Switch
                        id="cockpit-stress-toggle"
                        checked={stress}
                        onCheckedChange={onStressChange}
                        aria-label="Activer le stress-test"
                    />
                </div>
            </div>
            <div className="px-3 pb-3 pt-4">
                <ChartContainer config={TRAJECTORY_CONFIG} className="h-72 w-full">
                    <ComposedChart data={[...data.points]} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} interval={2} />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            fontSize={10}
                            tickFormatter={(v: number) => eurCompact(v)}
                            width={56}
                        />
                        <ReferenceArea
                            x1={`M${breakevenStart}`}
                            x2={`M${breakevenEnd}`}
                            strokeOpacity={0}
                            fill="var(--lumiris-amber)"
                            fillOpacity={0.12}
                            label={{
                                value: 'Point mort',
                                position: 'insideTop',
                                fill: 'var(--lumiris-amber)',
                                fontSize: 10,
                            }}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent indicator="dot" formatter={(value) => eurCompact(Number(value))} />
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey="arrAtelier"
                            stackId="arr"
                            stroke="var(--color-arrAtelier)"
                            fill="var(--color-arrAtelier)"
                            fillOpacity={0.5}
                        />
                        <Area
                            type="monotone"
                            dataKey="arrAffiliation"
                            stackId="arr"
                            stroke="var(--color-arrAffiliation)"
                            fill="var(--color-arrAffiliation)"
                            fillOpacity={0.5}
                        />
                        <Area
                            type="monotone"
                            dataKey="arrLocal"
                            stackId="arr"
                            stroke="var(--color-arrLocal)"
                            fill="var(--color-arrLocal)"
                            fillOpacity={0.5}
                        />
                        <Line
                            type="monotone"
                            dataKey="chargesAnnualized"
                            stroke="var(--color-chargesAnnualized)"
                            strokeDasharray="4 4"
                            strokeWidth={2}
                            dot={false}
                        />
                    </ComposedChart>
                </ChartContainer>
            </div>
        </div>
    );
}

const RATIO_TONE: Record<LtvCacRow['tone'], string> = {
    good: 'bg-lumiris-emerald/10 text-lumiris-emerald',
    watch: 'bg-lumiris-amber/10 text-lumiris-amber',
    bad: 'bg-lumiris-rose/10 text-lumiris-rose',
};

function LtvCacCard({ rows }: { rows: readonly LtvCacRow[] }) {
    return (
        <div className="opal-shadow border-border bg-card rounded-xl border lg:col-span-2">
            <div className="border-border flex items-center justify-between border-b px-6 py-4">
                <div>
                    <h3 className="text-foreground text-sm font-semibold">LTV / CAC par segment</h3>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        Objectif ≥ 3× sur tous les segments — survol = source.
                    </p>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                    Chiffrage v4.2 § 6
                </Badge>
            </div>
            <TooltipProvider>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-[11px]">Segment</TableHead>
                            <TableHead className="text-right text-[11px]">ARPU / an</TableHead>
                            <TableHead className="text-right text-[11px]">Durée</TableHead>
                            <TableHead className="text-right text-[11px]">LTV</TableHead>
                            <TableHead className="text-right text-[11px]">CAC</TableHead>
                            <TableHead className="text-right text-[11px]">Ratio</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="text-foreground text-xs">{row.label}</TableCell>
                                <TableCell className="text-muted-foreground text-right font-mono text-xs">
                                    {eur(row.arpuAnnualEur, 2)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-right font-mono text-xs">
                                    {row.lifetimeMonths} mois
                                </TableCell>
                                <TableCell className="text-foreground text-right font-mono text-xs">
                                    {eur(row.ltvEur, 2)}
                                </TableCell>
                                <TableCell className="text-foreground text-right font-mono text-xs">
                                    {eur(row.cacEur, 2)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span
                                                className={cn(
                                                    'inline-flex min-w-[3.5rem] cursor-help items-center justify-center rounded-md px-2 py-1 font-mono text-xs font-semibold',
                                                    RATIO_TONE[row.tone],
                                                )}
                                            >
                                                {Number.isFinite(row.ratio) ? `${row.ratio.toFixed(1)}×` : '∞'}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>Chiffrage v4.2 § 6</TooltipContent>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TooltipProvider>
        </div>
    );
}

const SOURCE_TONE: Record<string, string> = {
    Salon: 'bg-lumiris-emerald',
    CMA: 'bg-lumiris-cyan',
    Démarchage: 'bg-lumiris-amber',
    LinkedIn: 'bg-lumiris-orange',
    RP: 'bg-lumiris-rose',
};

function FunnelCard({ funnel }: { funnel: ReturnType<typeof buildAcquisitionFunnel> }) {
    return (
        <div className="opal-shadow border-border bg-card flex flex-col rounded-xl border">
            <div className="border-border border-b px-6 py-4">
                <h3 className="text-foreground text-sm font-semibold">Acquisition ATELIER — mois en cours</h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                    {funnel.totalLeads} prospects · ventilé par canal (fixtures V1).
                </p>
            </div>
            <div className="flex-1 space-y-4 px-6 py-4">
                {funnel.stages.map((stage) => {
                    const total = funnel.slices.reduce((s, sl) => s + sl.stages[stage.id], 0);
                    return (
                        <div key={stage.id}>
                            <div className="mb-1 flex items-baseline justify-between text-xs">
                                <span className="text-foreground font-medium">{stage.label}</span>
                                <span className="text-muted-foreground font-mono">
                                    {total} · {(stage.conversion * 100).toFixed(0)} %
                                </span>
                            </div>
                            <div className="bg-muted flex h-2 overflow-hidden rounded-full">
                                {funnel.slices.map((slice) => {
                                    const count = slice.stages[stage.id];
                                    const widthPct = funnel.totalLeads === 0 ? 0 : (count / funnel.totalLeads) * 100;
                                    if (widthPct === 0) return null;
                                    return (
                                        <span
                                            key={slice.source}
                                            className={cn('h-full', SOURCE_TONE[slice.source] ?? 'bg-muted-foreground')}
                                            style={{ width: `${widthPct}%` }}
                                            title={`${slice.source} : ${count}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                    {funnel.slices.map((slice) => (
                        <span key={slice.source} className="text-muted-foreground flex items-center gap-1.5">
                            <span
                                className={cn(
                                    'h-2 w-2 rounded-full',
                                    SOURCE_TONE[slice.source] ?? 'bg-muted-foreground',
                                )}
                            />
                            {slice.source}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function EsprCountdown({ entries }: { entries: ReturnType<typeof buildEsprCountdown> }) {
    return (
        <div className="opal-shadow border-border bg-card rounded-xl border">
            <div className="border-border flex items-center justify-between border-b px-6 py-4">
                <div>
                    <h3 className="text-foreground inline-flex items-center gap-2 text-sm font-semibold">
                        <Timer className="text-lumiris-amber h-4 w-4" aria-hidden /> Décompte ESPR
                    </h3>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        Trois jalons critiques à surveiller — source business-targets.ts.
                    </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <a href="/conformite" className="inline-flex items-center gap-1.5 text-xs">
                        Voir Conformité ESPR <ArrowRight className="h-3 w-3" />
                    </a>
                </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-3">
                {entries.map(({ deadline, daysLeft }) => {
                    const overdue = daysLeft < 0;
                    return (
                        <div
                            key={deadline.id}
                            className={cn(
                                'rounded-lg border p-4',
                                overdue ? 'border-lumiris-rose/30 bg-lumiris-rose/5' : 'border-border bg-muted/40',
                            )}
                        >
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                                {deadline.date}
                            </p>
                            <p
                                className={cn(
                                    'mt-1 font-mono text-2xl font-bold tabular-nums',
                                    overdue ? 'text-lumiris-rose' : 'text-foreground',
                                )}
                            >
                                {Math.abs(daysLeft).toLocaleString('fr-FR')} j{overdue ? ' en retard' : ''}
                            </p>
                            <p className="text-foreground mt-2 text-sm font-medium">{deadline.label}</p>
                            <p className="text-muted-foreground mt-1 text-xs">{deadline.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CurationActivity({ auditLog }: { auditLog: ReturnType<typeof useAdminAuditLog> }) {
    const entries = auditLog.slice(0, 6);
    return (
        <div className="opal-shadow border-border bg-card rounded-xl border">
            <div className="border-border flex items-center justify-between border-b px-6 py-4">
                <div>
                    <h3 className="text-foreground text-sm font-semibold">Activité de curation</h3>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        Validations, flags, overrides — audit log live (6 dernières).
                    </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <a href="/gouvernance" className="inline-flex items-center gap-1.5 text-xs">
                        Voir toute la gouvernance <ArrowRight className="h-3 w-3" />
                    </a>
                </Button>
            </div>
            <div className="divide-border divide-y">
                {entries.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-4 px-6 py-3.5">
                        <div className="bg-lumiris-emerald/8 text-lumiris-emerald flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
                            {entry.actorRole.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-foreground text-sm">
                                <span className="font-medium">{entry.actorId}</span>{' '}
                                <span className="text-muted-foreground">
                                    {entry.action} · {entry.targetType} {entry.targetId}
                                </span>
                            </p>
                        </div>
                        <span className="text-muted-foreground/60 shrink-0 font-mono text-[10px]">
                            {new Date(entry.ts).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>
                ))}
                {entries.length === 0 ? (
                    <p className="text-muted-foreground inline-flex items-center gap-2 px-6 py-8 text-center text-sm">
                        <AlertCircle className="h-3.5 w-3.5" /> Aucune activité récente.
                    </p>
                ) : null}
                <div className="px-6 py-3">
                    <BarChart3 className="text-muted-foreground/40 h-3.5 w-3.5" aria-hidden />
                </div>
            </div>
        </div>
    );
}

export const Cockpit = memo(CockpitComponent);
