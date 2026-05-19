'use client';

import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    BadgeCheck,
    Bell,
    Coins,
    CreditCard,
    Download,
    FileText,
    Filter,
    LineChart as LineIcon,
    Mail,
    Search,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';
import { mockMrrTrajectory, mockPaymentHistory, mockSubscriptions } from '@lumiris/mock-data';
import type { ArtisanTier, PaymentEvent, Subscription, SubscriptionStatus } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@lumiris/ui/components/alert-dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@lumiris/ui/components/chart';
import { Input } from '@lumiris/ui/components/input';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Switch } from '@lumiris/ui/components/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction, usePermission } from '@/lib/auth';
import {
    computeBillingKpi,
    computeLtvCac,
    computeMonthlyToAnnualConversion,
    computeViability,
    findBreakevenMonth,
    type LtvCacRow,
    type ViabilityPoint,
} from '@/lib/billing-kpi';
import { ORDERED_PRICE_IDS, PRICE_LINES, formatEur, type PriceLineId } from '@/lib/pricing';
import { KpiCard } from '@/components/kpi-card';
import { EmptyState } from '../_shared/empty-state';
import { GovernanceBanner } from '../_shared/governance-banner';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';
import { PermissionRequiredAction } from '../_shared/permission-required-action';

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
    active: 'Actif',
    trialing: 'Essai',
    past_due: 'Impayé',
    canceled: 'Annulé',
};

const STATUS_TONE: Record<SubscriptionStatus, string> = {
    active: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
    trialing: 'border-lumiris-cyan/40 bg-lumiris-cyan/10 text-lumiris-cyan',
    past_due: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
    canceled: 'border-muted-foreground/40 bg-muted text-muted-foreground',
};

const PAYMENT_STATUS_TONE: Record<PaymentEvent['status'], string> = {
    succeeded: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
    failed: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
    refunded: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
};

const PAYMENT_STATUS_LABEL: Record<PaymentEvent['status'], string> = {
    succeeded: 'Réussi',
    failed: 'Échoué',
    refunded: 'Remboursé',
};

function BillingComponent() {
    return <BillingInner />;
}

function BillingInner() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-5">
            <div className="flex items-baseline justify-between gap-3">
                <div>
                    <h2 className="text-foreground text-xl font-semibold">Facturation</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        MRR consolidé · {mockSubscriptions.length} abonnés · paiements 12 mois.
                    </p>
                </div>
            </div>

            <GovernanceBanner />
            <NonNegotiableBanner rule="Toute relance (dunning), émission de facture ou export financier est audit-loguée. Aucune écriture comptable n'est rétroactive — un remboursement crée toujours une nouvelle ligne." />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Synthèse</TabsTrigger>
                    <TabsTrigger value="viability">Viabilité</TabsTrigger>
                    <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
                    <TabsTrigger value="history">Historique paiements</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-5 pt-2">
                    <OverviewTab />
                </TabsContent>
                <TabsContent value="viability" className="space-y-5 pt-2">
                    <ViabilityTab />
                </TabsContent>
                <TabsContent value="subscriptions" className="space-y-5 pt-2">
                    <SubscriptionsTab />
                </TabsContent>
                <TabsContent value="history" className="space-y-5 pt-2">
                    <HistoryTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ─── Overview ───────────────────────────────────────────────────────────────

function OverviewTab() {
    const kpi = useMemo(() => computeBillingKpi(mockSubscriptions, mockMrrTrajectory), []);
    const ltvCac = useMemo(() => computeLtvCac(), []);
    const conversion = useMemo(() => computeMonthlyToAnnualConversion(mockSubscriptions), []);

    const mrrConfig = {
        solo: { label: PRICE_LINES.solo.shortLabel, color: PRICE_LINES.solo.color },
        studio: { label: PRICE_LINES.studio.shortLabel, color: PRICE_LINES.studio.color },
        maison: { label: PRICE_LINES.maison.shortLabel, color: PRICE_LINES.maison.color },
        plus: { label: PRICE_LINES.plus.shortLabel, color: PRICE_LINES.plus.color },
        local: { label: PRICE_LINES.local.shortLabel, color: PRICE_LINES.local.color },
    } satisfies ChartConfig;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3 lg:grid-cols-4"
            >
                <KpiCard
                    label="MRR consolidé"
                    value={formatEur(kpi.mrr)}
                    icon={<Coins className="h-4 w-4" />}
                    tone="text-lumiris-emerald"
                />
                <KpiCard
                    label="ARR projeté"
                    value={`${(kpi.arr / 1000).toFixed(1)} k€`}
                    icon={<TrendingUp className="h-4 w-4" />}
                    tone="text-lumiris-cyan"
                />
                <KpiCard
                    label="Net new MRR 30j"
                    value={`${kpi.netNew >= 0 ? '+' : ''}${formatEur(kpi.netNew)}`}
                    icon={kpi.netNew >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    tone={kpi.netNew >= 0 ? 'text-lumiris-emerald' : 'text-lumiris-rose'}
                />
                <KpiCard
                    label="Conversion mensuel → annuel 90j"
                    value={`${conversion.pct.toFixed(1)} %`}
                    sub={`${conversion.annualLike}/${conversion.totalActive} actifs`}
                    icon={<TrendingUp className="h-4 w-4" />}
                    tone="text-lumiris-amber"
                />
            </motion.div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="border-border bg-card rounded-xl border p-4 lg:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-foreground text-sm font-medium">
                            Trajectoire MRR — 6 mois (Solo · Studio · Maison · ATELIER+ · Local)
                        </p>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            5 séries empilées
                        </Badge>
                    </div>
                    <ChartContainer config={mrrConfig} className="h-56 w-full">
                        <BarChart data={mockMrrTrajectory.map((p) => ({ ...p }))}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} />
                            <YAxis tickLine={false} axisLine={false} fontSize={10} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="solo" stackId="m" fill="var(--color-solo)" />
                            <Bar dataKey="studio" stackId="m" fill="var(--color-studio)" />
                            <Bar dataKey="maison" stackId="m" fill="var(--color-maison)" />
                            <Bar dataKey="plus" stackId="m" fill="var(--color-plus)" />
                            <Bar dataKey="local" stackId="m" fill="var(--color-local)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </div>

                <div className="border-border bg-card space-y-3 rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-foreground text-sm font-medium">LTV / CAC par segment</p>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            5 lignes
                        </Badge>
                    </div>
                    <ul className="space-y-2">
                        {ltvCac.map((row) => (
                            <LtvCacRowItem key={row.id} row={row} />
                        ))}
                    </ul>
                    <p className="text-muted-foreground text-[10px]">
                        Marge brute 80 % · rétention modélisée par tier. Doublé dans le Cockpit pour autonomie.
                    </p>
                </div>
            </div>

            <div className="border-border bg-card rounded-xl border p-4">
                <p className="text-foreground mb-3 text-sm font-medium">Split MRR mois courant</p>
                <ul className="grid grid-cols-2 gap-3 text-xs lg:grid-cols-5">
                    {ORDERED_PRICE_IDS.map((id) => (
                        <SplitRow
                            key={id}
                            label={PRICE_LINES[id].label}
                            value={kpi.split[id]}
                            tone={PRICE_LINES[id].color}
                        />
                    ))}
                </ul>
                <p className="text-muted-foreground mt-3 text-[10px]">
                    ATELIER et ATELIER+ sont comptabilisés séparément — l&apos;add-on n&apos;est jamais agrégé au plan
                    de base.
                </p>
            </div>
        </>
    );
}

function LtvCacRowItem({ row }: { row: LtvCacRow }) {
    const ratioTone =
        row.ratio >= 4 ? 'text-lumiris-emerald' : row.ratio >= 2.5 ? 'text-lumiris-amber' : 'text-lumiris-rose';
    return (
        <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                <span className="text-foreground text-[11px] font-medium">{row.label}</span>
            </span>
            <span className="text-muted-foreground text-right font-mono text-[11px]">
                LTV {formatEur(row.ltvEur)} · CAC {formatEur(row.cacEur)}{' '}
                <span className={cn('font-semibold', ratioTone)}>×{row.ratio.toFixed(1)}</span>
            </span>
        </li>
    );
}

function SplitRow({ label, value, tone }: { label: string; value: number; tone: string }) {
    const max = 350;
    return (
        <li>
            <div className="flex items-center justify-between text-[11px]">
                <span className="text-foreground">{label}</span>
                <span className="text-muted-foreground font-mono">{formatEur(value)}</span>
            </div>
            <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: tone }}
                />
            </div>
        </li>
    );
}

// ─── Viability ──────────────────────────────────────────────────────────────

function ViabilityTab() {
    const [stressed, setStressed] = useState(false);
    const points = useMemo(() => computeViability(36), []);
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    const baseBreakeven = useMemo(() => findBreakevenMonth(points, false), [points]);
    const stressBreakeven = useMemo(() => findBreakevenMonth(points, true), [points]);
    const currentBreakeven = stressed ? stressBreakeven : baseBreakeven;

    const data: Array<ViabilityPoint & { revenueShown: number; ebitdaShown: number }> = points.map((p) => ({
        ...p,
        revenueShown: stressed ? p.revenueStressedEur : p.revenueEur,
        ebitdaShown: stressed ? p.ebitdaStressedEur : p.ebitdaEur,
    }));

    const config = {
        revenueShown: { label: 'Revenus mensuels', color: 'var(--lumiris-emerald)' },
        costEur: { label: 'Charges mensuelles', color: 'var(--lumiris-rose)' },
        ebitdaShown: { label: 'EBITDA', color: 'var(--lumiris-cyan)' },
    } satisfies ChartConfig;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3 lg:grid-cols-4"
            >
                <KpiCard
                    label="Point mort base"
                    value={baseBreakeven ? `M${baseBreakeven}` : 'N/A'}
                    sub="Trajectoire nominale"
                    icon={<LineIcon className="h-4 w-4" />}
                    tone="text-lumiris-emerald"
                />
                <KpiCard
                    label="Point mort stress"
                    value={stressBreakeven ? `M${stressBreakeven}` : 'N/A'}
                    sub="-30 % B2B / -33 % B2C"
                    icon={<ShieldAlert className="h-4 w-4" />}
                    tone="text-lumiris-amber"
                />
                <KpiCard
                    label="Burn M0"
                    value={firstPoint ? formatEur(firstPoint.costEur) : 'N/A'}
                    sub="Charges mensuelles fixes"
                    icon={<TrendingDown className="h-4 w-4" />}
                    tone="text-lumiris-rose"
                />
                <KpiCard
                    label="Run-rate M36"
                    value={lastPoint ? formatEur(lastPoint.revenueEur) : 'N/A'}
                    sub="Revenus mensuels cible"
                    icon={<TrendingUp className="h-4 w-4" />}
                    tone="text-lumiris-cyan"
                />
            </motion.div>

            <div className="border-border bg-card rounded-xl border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-foreground text-sm font-medium">
                            Revenus vs charges — M0 → M36 (// Chiffrage v4.2 § 8)
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">
                            Point mort affiché à{' '}
                            <span className="font-mono">
                                {currentBreakeven ? `M${currentBreakeven}` : 'hors fenêtre'}
                            </span>{' '}
                            — bascule le stress-test pour observer le décalage.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label
                            htmlFor="stress-toggle"
                            className="text-muted-foreground text-[11px] uppercase tracking-wider"
                        >
                            Stress-test (-30 % B2B / -33 % B2C)
                        </Label>
                        <Switch id="stress-toggle" checked={stressed} onCheckedChange={setStressed} />
                    </div>
                </div>
                <ChartContainer config={config} className="h-72 w-full">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} />
                        <YAxis tickLine={false} axisLine={false} fontSize={10} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                        {currentBreakeven !== null ? (
                            <ReferenceLine
                                x={`M${currentBreakeven}`}
                                stroke={stressed ? 'var(--lumiris-amber)' : 'var(--lumiris-emerald)'}
                                strokeDasharray="4 4"
                                label={{
                                    value: stressed
                                        ? `Point mort stress M${currentBreakeven}`
                                        : `Point mort M${currentBreakeven}`,
                                    position: 'insideTopRight',
                                    fontSize: 10,
                                    fill: stressed ? 'var(--lumiris-amber)' : 'var(--lumiris-emerald)',
                                }}
                            />
                        ) : null}
                        <Area
                            type="monotone"
                            dataKey="revenueShown"
                            fill="var(--color-revenueShown)"
                            stroke="var(--color-revenueShown)"
                            fillOpacity={0.18}
                        />
                        <Line
                            type="monotone"
                            dataKey="costEur"
                            stroke="var(--color-costEur)"
                            dot={false}
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="ebitdaShown"
                            stroke="var(--color-ebitdaShown)"
                            dot={false}
                            strokeWidth={2}
                        />
                    </ComposedChart>
                </ChartContainer>
            </div>

            <div className="border-border bg-muted/30 rounded-xl border p-4 text-xs">
                <p className="text-foreground font-medium">Lecture rapide</p>
                <ul className="text-muted-foreground mt-2 space-y-1.5">
                    <li>
                        <span className="text-foreground font-mono">M0 → M{baseBreakeven ?? '?'}</span> : EBITDA négatif
                        — amorçage financé sur fonds propres + premiers tickets.
                    </li>
                    <li>
                        <span className="text-foreground font-mono">M{baseBreakeven ?? '?'} → M36</span> : EBITDA
                        positif, marge opérationnelle absorbe les recrutements.
                    </li>
                    <li>
                        Stress-test : point mort décalé de{' '}
                        <span className="text-lumiris-amber font-mono">
                            +{(stressBreakeven ?? 0) - (baseBreakeven ?? 0)} mois
                        </span>
                        , runway requis recalculé en conséquence.
                    </li>
                </ul>
            </div>
        </>
    );
}

// ─── Subscriptions ──────────────────────────────────────────────────────────

function SubscriptionsTab() {
    const [internalTab, setInternalTab] = useState<'artisans' | 'repairers'>('artisans');

    return (
        <div className="space-y-4">
            <Tabs value={internalTab} onValueChange={(v) => setInternalTab(v as typeof internalTab)}>
                <TabsList>
                    <TabsTrigger value="artisans">Artisans (ATELIER)</TabsTrigger>
                    <TabsTrigger value="repairers">Retoucheurs (Local)</TabsTrigger>
                </TabsList>
                <TabsContent value="artisans" className="space-y-4 pt-2">
                    <SubscriptionsTable scope="artisan" />
                    <DunningTemplates scope="artisan" />
                </TabsContent>
                <TabsContent value="repairers" className="space-y-4 pt-2">
                    <SubscriptionsTable scope="repairer" />
                    <DunningTemplates scope="repairer" />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SubscriptionsTable({ scope }: { scope: 'artisan' | 'repairer' }) {
    const log = useLogAction();
    const canDun = usePermission('billing.dunning');
    const canExport = usePermission('billing.export');
    const canIssueInvoice = usePermission('billing.invoice_issue');

    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState<ArtisanTier | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
    const [plusFilter, setPlusFilter] = useState<'all' | 'on' | 'off'>('all');
    const [cityFilter, setCityFilter] = useState<string>('all');
    const [recentlyDunned, setRecentlyDunned] = useState<Set<string>>(new Set());
    const [recentlyInvoiced, setRecentlyInvoiced] = useState<Set<string>>(new Set());
    const [dunningTarget, setDunningTarget] = useState<Subscription | null>(null);
    const [dunningTypedName, setDunningTypedName] = useState('');
    const [statusAnnouncement, setStatusAnnouncement] = useState('');

    const baseRows = useMemo(() => mockSubscriptions.filter((s) => s.subscriberKind === scope), [scope]);

    const cities = useMemo(() => Array.from(new Set(baseRows.map((s) => s.city))).sort(), [baseRows]);

    const rows = useMemo(() => {
        return baseRows.filter((s) => {
            if (scope === 'artisan' && tierFilter !== 'all' && s.artisanTier !== tierFilter) return false;
            if (statusFilter !== 'all' && s.status !== statusFilter) return false;
            if (scope === 'artisan') {
                if (plusFilter === 'on' && !s.plus) return false;
                if (plusFilter === 'off' && s.plus) return false;
            }
            if (cityFilter !== 'all' && s.city !== cityFilter) return false;
            if (search.trim().length > 0 && !s.displayName.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [baseRows, scope, search, tierFilter, statusFilter, plusFilter, cityFilter]);

    const handleConfirmDunning = (sub: Subscription) => {
        const attemptNumber = (sub.dunningAttempts ?? 0) + 1;
        const tierLabel = sub.subscriberKind === 'artisan' ? (sub.artisanTier ?? sub.tier) : PRICE_LINES.local.label;
        const entry = log({
            action: 'billing.dunning',
            targetType: 'subscription',
            targetId: sub.id,
            payload: {
                tier: sub.tier,
                tierLabel,
                mrr: sub.mrrEur,
                attemptNumber,
                channel: 'email_mock',
                template: dunningTemplateId(sub),
            },
        });
        setRecentlyDunned((prev) => new Set(prev).add(sub.id));
        setStatusAnnouncement(`Relance n°${attemptNumber} envoyée à ${sub.displayName} — audit log ${entry.id} créé.`);
        setDunningTarget(null);
        setDunningTypedName('');
    };

    const handleInvoice = (sub: Subscription) => {
        log({
            action: 'billing.invoice_issue',
            targetType: 'subscription',
            targetId: sub.id,
            payload: {
                tier: sub.tier,
                plus: sub.plus,
                mrr: sub.mrrEur,
                kind: sub.subscriberKind,
                format: 'pdf_stub',
                issuedAt: new Date().toISOString(),
            },
        });
        setRecentlyInvoiced((prev) => new Set(prev).add(sub.id));
        if (typeof window !== 'undefined') openInvoiceWindow(sub);
    };

    const handleExport = () => {
        const header = ['id', 'displayName', 'kind', 'tier', 'plus', 'mrr', 'status', 'nextBillingAt', 'city'].join(
            ',',
        );
        const lines = rows.map((s) =>
            [
                s.id,
                s.displayName,
                s.subscriberKind,
                s.tier,
                s.plus ? 'yes' : 'no',
                s.mrrEur,
                s.status,
                s.nextBillingAt,
                s.city,
            ]
                .map((v) => String(v).replace(/,/g, ';'))
                .join(','),
        );
        const csv = `${header}\n${lines.join('\n')}`;
        log({
            action: 'billing.export',
            targetType: 'period',
            targetId: `subs-${scope}-${new Date().toISOString().slice(0, 10)}`,
            payload: { count: rows.length, format: 'csv', scope },
        });
        if (typeof window !== 'undefined') {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lumiris-subs-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <>
            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <div className="min-w-55 relative flex-1">
                    <Search className="text-muted-foreground/60 absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Raison sociale…"
                        className="pl-8"
                    />
                </div>
                {scope === 'artisan' ? (
                    <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as ArtisanTier | 'all')}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Tier" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous tiers</SelectItem>
                            <SelectItem value="Solo">{PRICE_LINES.solo.shortLabel}</SelectItem>
                            <SelectItem value="Studio">{PRICE_LINES.studio.shortLabel}</SelectItem>
                            <SelectItem value="Maison">{PRICE_LINES.maison.shortLabel}</SelectItem>
                        </SelectContent>
                    </Select>
                ) : null}
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SubscriptionStatus | 'all')}>
                    <SelectTrigger className="w-36">
                        <Filter className="mr-1 h-3.5 w-3.5" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="trialing">Essai</SelectItem>
                        <SelectItem value="past_due">Impayé</SelectItem>
                        <SelectItem value="canceled">Annulé</SelectItem>
                    </SelectContent>
                </Select>
                {scope === 'artisan' ? (
                    <Select value={plusFilter} onValueChange={(v) => setPlusFilter(v as typeof plusFilter)}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ATELIER+</SelectItem>
                            <SelectItem value="on">Activé</SelectItem>
                            <SelectItem value="off">Inactif</SelectItem>
                        </SelectContent>
                    </Select>
                ) : null}
                <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes villes</SelectItem>
                        {cities.map((c) => (
                            <SelectItem key={c} value={c}>
                                {c}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport} disabled={!canExport}>
                    <Download className="h-3.5 w-3.5" /> Exporter CSV
                </Button>
            </div>

            {rows.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="Aucun abonnement ne correspond aux filtres"
                    description="Élargissez le périmètre (statut, tier, ville) ou réinitialisez la recherche pour retrouver les comptes à accompagner."
                    action={
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setSearch('');
                                setTierFilter('all');
                                setStatusFilter('all');
                                setPlusFilter('all');
                                setCityFilter('all');
                            }}
                            className="gap-1.5"
                        >
                            <Filter className="h-3.5 w-3.5" aria-hidden /> Réinitialiser les filtres
                        </Button>
                    }
                />
            ) : null}

            <div className="border-border bg-card overflow-hidden rounded-xl border" hidden={rows.length === 0}>
                <Table>
                    <TableHeader stickyHeader>
                        <TableRow>
                            <TableHead>Compte</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead className="text-right">MRR</TableHead>
                            <TableHead>Prochaine échéance</TableHead>
                            <TableHead>Méthode</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((sub) => {
                            const dunned = recentlyDunned.has(sub.id);
                            const invoiced = recentlyInvoiced.has(sub.id);
                            return (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div>
                                            <p className="text-foreground text-sm font-medium">{sub.displayName}</p>
                                            <p className="text-muted-foreground text-[10px]">
                                                {sub.subscriberKind === 'artisan' ? 'Artisan' : 'Retoucheur'} ·{' '}
                                                {sub.city}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Badge variant="outline" className="font-mono text-[10px] capitalize">
                                                {sub.artisanTier ?? sub.tier}
                                            </Badge>
                                            {sub.plus ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-lumiris-orange/40 text-lumiris-orange font-mono text-[10px]"
                                                >
                                                    ATELIER+
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {formatEur(sub.mrrEur)}
                                    </TableCell>
                                    <TableCell className="font-mono text-[11px]">
                                        {new Date(sub.nextBillingAt).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-[11px]">
                                            <CreditCard className="h-3 w-3" />
                                            {sub.paymentMethod.brand.toUpperCase()} ····{sub.paymentMethod.last4}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('font-mono text-[10px]', STATUS_TONE[sub.status])}
                                        >
                                            {STATUS_LABEL[sub.status]}
                                        </Badge>
                                        {dunned ? (
                                            <Badge
                                                variant="outline"
                                                className="border-lumiris-amber/40 text-lumiris-amber ml-1.5 font-mono text-[10px]"
                                            >
                                                <Bell className="mr-1 h-2.5 w-2.5" /> Relance envoyée
                                            </Badge>
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center justify-end gap-1.5">
                                            {sub.status === 'past_due' ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!canDun || dunned}
                                                    onClick={() => setDunningTarget(sub)}
                                                    className="gap-1.5"
                                                >
                                                    <Bell className="h-3 w-3" />
                                                    {dunned ? 'Relancé' : 'Relancer'}
                                                </Button>
                                            ) : null}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={!canIssueInvoice || sub.tier === 'free'}
                                                onClick={() => handleInvoice(sub)}
                                                className="gap-1.5"
                                            >
                                                <FileText className="h-3 w-3" />
                                                {invoiced ? 'Re-générer' : 'Générer facture'}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center text-xs">
                                    Aucun abonnement ne correspond aux filtres.
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog
                open={dunningTarget !== null}
                onOpenChange={(o) => {
                    if (!o) {
                        setDunningTarget(null);
                        setDunningTypedName('');
                    }
                }}
            >
                <AlertDialogContent aria-describedby="dunning-dialog-description">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Relancer {dunningTarget?.displayName} ?</AlertDialogTitle>
                        <AlertDialogDescription id="dunning-dialog-description">
                            Template :{' '}
                            <code className="bg-muted rounded px-1 font-mono">
                                {dunningTarget ? dunningTemplateId(dunningTarget) : ''}
                            </code>{' '}
                            · tentative n°{(dunningTarget?.dunningAttempts ?? 0) + 1}. L&apos;action est audit-loguée et
                            envoie un email au compte facturé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {dunningTarget ? (
                        <div className="space-y-1.5">
                            <Label htmlFor="dunning-typed-name" className="text-[11px]">
                                Tapez le nom exact du compte pour confirmer :{' '}
                                <span className="text-foreground font-mono">{dunningTarget.displayName}</span>
                            </Label>
                            <Input
                                id="dunning-typed-name"
                                value={dunningTypedName}
                                onChange={(e) => setDunningTypedName(e.target.value)}
                                placeholder={dunningTarget.displayName}
                                aria-describedby="dunning-dialog-description"
                            />
                        </div>
                    ) : null}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <PermissionRequiredAction requires="billing.dunning">
                            <AlertDialogAction
                                disabled={
                                    !dunningTarget || !canDun || dunningTypedName.trim() !== dunningTarget.displayName
                                }
                                onClick={() => dunningTarget && handleConfirmDunning(dunningTarget)}
                            >
                                Envoyer la relance
                            </AlertDialogAction>
                        </PermissionRequiredAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {statusAnnouncement}
            </div>
        </>
    );
}

// ─── Dunning templates ──────────────────────────────────────────────────────

interface DunningTemplate {
    id: string;
    tierId: PriceLineId;
    label: string;
    subject: string;
    body: string;
}

const DUNNING_TEMPLATES: readonly DunningTemplate[] = [
    {
        id: 'dun-solo',
        tierId: 'solo',
        label: `${PRICE_LINES.solo.label} (${formatEur(PRICE_LINES.solo.monthlyEur)}/mois)`,
        subject: 'Votre abonnement ATELIER Solo nécessite un renouvellement',
        body:
            'Bonjour, votre dernier prélèvement de {{mrr}} pour ATELIER Solo a échoué. ' +
            "Réactivez-le en quelques secondes pour ne pas interrompre vos passeports. L'équipe LUMIRIS reste joignable.",
    },
    {
        id: 'dun-studio',
        tierId: 'studio',
        label: `${PRICE_LINES.studio.label} (${formatEur(PRICE_LINES.studio.monthlyEur)}/mois)`,
        subject: 'Atelier Studio — paiement en attente',
        body:
            "Bonjour, le prélèvement Studio de {{mrr}} n'a pas abouti. Vos collaborateurs continuent d'accéder à l'atelier " +
            'pendant 7 jours, puis lecture seule. Renouvelez votre moyen de paiement pour reprendre la curation.',
    },
    {
        id: 'dun-maison',
        tierId: 'maison',
        label: `${PRICE_LINES.maison.label} (${formatEur(PRICE_LINES.maison.monthlyEur)}/mois)`,
        subject: 'Maison — incident de facturation à régulariser',
        body:
            'Bonjour, votre abonnement Maison ({{mrr}}) est en impayé. Un chargé de compte LUMIRIS vous contactera ' +
            'sous 24 h. Vous pouvez aussi régulariser depuis votre espace facturation.',
    },
    {
        id: 'dun-local',
        tierId: 'local',
        label: `${PRICE_LINES.local.label} (${formatEur(PRICE_LINES.local.monthlyEur)}/mois)`,
        subject: 'LUMIRIS Local — réactivez votre visibilité retoucheur',
        body:
            "Bonjour, votre abonnement Local de {{mrr}} n'a pas pu être renouvelé. Vos demandes entrantes sont mises en " +
            "pause jusqu'à régularisation. Mettez à jour votre moyen de paiement pour reprendre les RDV.",
    },
];

function dunningTemplateId(sub: Subscription): string {
    if (sub.subscriberKind === 'repairer') return 'dun-local';
    if (sub.tier === 'maison') return 'dun-maison';
    if (sub.tier === 'studio') return 'dun-studio';
    return 'dun-solo';
}

function DunningTemplates({ scope }: { scope: 'artisan' | 'repairer' }) {
    const templates = useMemo(
        () => DUNNING_TEMPLATES.filter((t) => (scope === 'artisan' ? t.tierId !== 'local' : t.tierId === 'local')),
        [scope],
    );
    return (
        <div className="border-border bg-card rounded-xl border p-4">
            <div className="mb-3 flex items-center gap-2">
                <Mail className="text-muted-foreground h-3.5 w-3.5" />
                <p className="text-foreground text-sm font-medium">Templates de relance par tier</p>
                <Badge variant="outline" className="font-mono text-[10px]">
                    {templates.length} actif{templates.length > 1 ? 's' : ''}
                </Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {templates.map((t) => (
                    <article key={t.id} className="border-border bg-background rounded-lg border p-3 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-foreground font-semibold">{t.label}</span>
                            <code className="text-muted-foreground font-mono text-[10px]">{t.id}</code>
                        </div>
                        <p className="text-muted-foreground mt-1 italic">{t.subject}</p>
                        <p className="text-foreground/80 mt-2 leading-relaxed">{t.body}</p>
                    </article>
                ))}
            </div>
        </div>
    );
}

// ─── Invoice stub ───────────────────────────────────────────────────────────

function openInvoiceWindow(sub: Subscription) {
    const win = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
    if (!win) return;
    const now = new Date();
    const invoiceNo = `LMR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${sub.id.slice(-5).toUpperCase()}`;
    const tierLabel =
        sub.subscriberKind === 'artisan'
            ? `ATELIER ${sub.artisanTier ?? sub.tier}${sub.plus ? ' + ATELIER+' : ''}`
            : PRICE_LINES.local.label;
    const line1Eur = sub.mrrEur;
    const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Facture ${invoiceNo}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; color:#1c1c1e; padding:48px; max-width:720px; margin:0 auto; }
  header { display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px solid #d4d4d8; padding-bottom:16px; }
  h1 { font-size:22px; margin:0; letter-spacing:-0.02em; }
  .meta { color:#71717a; font-size:12px; }
  table { width:100%; border-collapse:collapse; margin-top:32px; }
  th, td { padding:10px 0; text-align:left; font-size:13px; }
  th { color:#71717a; font-weight:500; border-bottom:1px solid #e4e4e7; }
  tfoot td { font-weight:600; border-top:1px solid #d4d4d8; padding-top:16px; }
  .right { text-align:right; }
  .small { color:#a1a1aa; font-size:11px; margin-top:48px; }
</style></head>
<body>
  <header>
    <div>
      <h1>LUMIRIS — Facture</h1>
      <p class="meta">${invoiceNo} · émise le ${now.toLocaleDateString('fr-FR')}</p>
    </div>
    <div class="meta right">
      LUMIRIS SAS<br>RCS Paris · TVA FR 00 000000000<br>contact@lumiris.fr
    </div>
  </header>
  <section style="margin-top:32px;">
    <p class="meta">Facturé à</p>
    <p><strong>${sub.displayName}</strong><br>${sub.city}<br>Compte : ${sub.subscriberId}</p>
  </section>
  <table>
    <thead><tr><th>Désignation</th><th class="right">Période</th><th class="right">Montant HT</th></tr></thead>
    <tbody>
      <tr>
        <td>${tierLabel}</td>
        <td class="right">${new Date(sub.lastChargeAt ?? sub.startedAt).toLocaleDateString('fr-FR')} → ${new Date(sub.nextBillingAt).toLocaleDateString('fr-FR')}</td>
        <td class="right">${line1Eur.toLocaleString('fr-FR')} €</td>
      </tr>
    </tbody>
    <tfoot>
      <tr><td>Total HT</td><td></td><td class="right">${line1Eur.toLocaleString('fr-FR')} €</td></tr>
    </tfoot>
  </table>
  <p class="small">Document généré par LUMIRIS Back-office · stub V1.</p>
  <script>setTimeout(() => window.print(), 250);</script>
</body></html>`;
    win.document.write(html);
    win.document.close();
}

// ─── Payment history ────────────────────────────────────────────────────────

function HistoryTab() {
    const [statusFilter, setStatusFilter] = useState<PaymentEvent['status'] | 'all'>('all');
    const [kindFilter, setKindFilter] = useState<'all' | 'artisan' | 'repairer'>('all');
    const [periodFilter, setPeriodFilter] = useState<'30d' | '90d' | '12m' | 'all'>('12m');

    const rows = useMemo(() => {
        const now = Date.now();
        const cutoffMs =
            periodFilter === '30d'
                ? 30 * 86_400_000
                : periodFilter === '90d'
                  ? 90 * 86_400_000
                  : periodFilter === '12m'
                    ? 365 * 86_400_000
                    : Number.POSITIVE_INFINITY;
        return mockPaymentHistory.filter((p) => {
            if (statusFilter !== 'all' && p.status !== statusFilter) return false;
            if (kindFilter !== 'all' && p.subscriberKind !== kindFilter) return false;
            if (now - new Date(p.chargedAt).getTime() > cutoffMs) return false;
            return true;
        });
    }, [statusFilter, kindFilter, periodFilter]);

    const summary = useMemo(() => {
        const succeeded = rows.filter((r) => r.status === 'succeeded');
        const failed = rows.filter((r) => r.status === 'failed');
        const succeededAmount = succeeded.reduce((sum, r) => sum + r.amountEur, 0);
        const failedAmount = failed.reduce((sum, r) => sum + r.amountEur, 0);
        return {
            count: rows.length,
            succeeded: succeeded.length,
            failed: failed.length,
            succeededAmount,
            failedAmount,
        };
    }, [rows]);

    return (
        <>
            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger className="w-36">
                        <Filter className="mr-1 h-3.5 w-3.5" /> <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        <SelectItem value="succeeded">Réussis</SelectItem>
                        <SelectItem value="failed">Échoués</SelectItem>
                        <SelectItem value="refunded">Remboursés</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as typeof kindFilter)}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous acteurs</SelectItem>
                        <SelectItem value="artisan">Artisans</SelectItem>
                        <SelectItem value="repairer">Retoucheurs</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="30d">30 jours</SelectItem>
                        <SelectItem value="90d">90 jours</SelectItem>
                        <SelectItem value="12m">12 mois</SelectItem>
                        <SelectItem value="all">Tout</SelectItem>
                    </SelectContent>
                </Select>
                <div className="text-muted-foreground ml-auto flex items-center gap-3 text-[11px]">
                    <span className="text-lumiris-emerald inline-flex items-center gap-1">
                        <BadgeCheck className="h-3 w-3" /> {summary.succeeded} réussis ·{' '}
                        {formatEur(summary.succeededAmount)}
                    </span>
                    <span className="text-lumiris-rose inline-flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {summary.failed} échoués · {formatEur(summary.failedAmount)}
                    </span>
                </div>
            </div>

            {rows.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="Aucun paiement ne correspond aux filtres"
                    description="Élargissez la période ou réinitialisez les filtres pour explorer l'historique."
                    action={
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setStatusFilter('all');
                                setKindFilter('all');
                                setPeriodFilter('12m');
                            }}
                            className="gap-1.5"
                        >
                            <Filter className="h-3.5 w-3.5" aria-hidden /> Réinitialiser les filtres
                        </Button>
                    }
                />
            ) : null}

            <div className="border-border bg-card overflow-hidden rounded-xl border" hidden={rows.length === 0}>
                <Table>
                    <TableHeader stickyHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Compte</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Détail</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.slice(0, 100).map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="font-mono text-[11px]">
                                    {new Date(p.chargedAt).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell>
                                    <p className="text-foreground text-sm">{p.displayName}</p>
                                    <p className="text-muted-foreground text-[10px]">
                                        {p.subscriberKind} · {p.subscriberId}
                                    </p>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">{formatEur(p.amountEur)}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn('font-mono text-[10px]', PAYMENT_STATUS_TONE[p.status])}
                                    >
                                        {PAYMENT_STATUS_LABEL[p.status]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                        {p.failureReason ?? '-'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-xs">
                                    Aucun paiement ne correspond aux filtres.
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
                {rows.length > 100 ? (
                    <div className="border-border text-muted-foreground border-t px-4 py-2 text-center text-[11px]">
                        Affichage limité à 100 lignes — affinez les filtres pour voir le reste ({rows.length} au total).
                    </div>
                ) : null}
            </div>
        </>
    );
}

export const Billing = memo(BillingComponent);
