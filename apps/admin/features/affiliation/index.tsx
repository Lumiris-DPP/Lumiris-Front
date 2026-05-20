'use client';

import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowDownToLine,
    BadgeCheck,
    CheckCircle2,
    Coins,
    Filter,
    Flag,
    Landmark,
    MapPin,
    ShieldOff,
    SlidersHorizontal,
    TrendingUp,
    Users,
    Wrench,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
    mockAffiliationEvents,
    mockAffiliationTrajectory,
    mockArtisans,
    mockPayouts,
    mockRepairers,
} from '@lumiris/mock-data';
import type { AffiliationEvent, AffiliationKind, AffiliationPayoutStatus, Payout } from '@lumiris/types';
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
import { Textarea } from '@lumiris/ui/components/textarea';
import { cn } from '@lumiris/ui/lib/cn';
import { useLogAction, usePermission } from '@/lib/auth';
import {
    ANONYMISATION_THRESHOLD_DAYS,
    NOW_REF,
    anonymiseUserId,
    buildSuspicionMap,
    matchesFraudFilter,
    type FraudFilter,
    type SuspiciousFlag,
} from '@/lib/affiliation-fraud';
import {
    DEFAULT_PURCHASE_RATES,
    DEFAULT_REPAIR_COMMISSION,
    PURCHASE_RATE_BOUNDS,
    RATE_CHANGE_REASON_MIN_LENGTH,
    REPAIR_FLAT_BOUNDS,
    REPAIR_PCT_BOUNDS,
    type ProductCategory,
    type PurchaseRate,
    type RepairCommission,
    validatePurchaseRate,
    validateRepairFlat,
    validateRepairPct,
} from '@/lib/affiliation-config';
import { KpiCard } from '@/components/kpi-card';
import { EmptyState } from '../_shared/empty-state';
import { GovernanceBanner } from '../_shared/governance-banner';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';
import { PaginationBar } from '../_shared/pagination-bar';
import { usePagination } from '../_shared/use-pagination';

type BankStatus = 'awaiting' | 'wire_sent' | 'reconciled' | 'failed';

const BANK_STATUS_LABEL: Record<BankStatus, string> = {
    awaiting: 'En attente',
    wire_sent: 'Virement émis',
    reconciled: 'Réconcilié',
    failed: 'Échec',
};

const BANK_STATUS_TONE: Record<BankStatus, string> = {
    awaiting: 'border-lumiris-amber/40 text-lumiris-amber',
    wire_sent: 'border-lumiris-cyan/40 text-lumiris-cyan',
    reconciled: 'border-lumiris-emerald/40 text-lumiris-emerald',
    failed: 'border-lumiris-rose/40 text-lumiris-rose',
};

function inferBankStatus(p: Payout): BankStatus {
    if (p.status === 'paid') return 'reconciled';
    if (p.status === 'prepared') return 'wire_sent';
    return 'awaiting';
}

function inferExpectedDate(p: Payout): string {
    if (p.paidAt) return p.paidAt;
    if (p.preparedAt) {
        return new Date(new Date(p.preparedAt).getTime() + 2 * 86_400_000).toISOString();
    }
    return new Date(NOW_REF + 5 * 86_400_000).toISOString();
}

function AffiliationComponent() {
    return <AffiliationInner />;
}

function AffiliationInner() {
    const [activeTab, setActiveTab] = useState('overview');
    const [extraFlagged, setExtraFlagged] = useState<Set<string>>(new Set());
    const [paidEventIds, setPaidEventIds] = useState<Set<string>>(new Set());
    const [bankStatuses, setBankStatuses] = useState<Map<string, BankStatus>>(
        () => new Map(mockPayouts.map((p) => [p.id, inferBankStatus(p)])),
    );

    const events = useMemo(() => {
        return mockAffiliationEvents.map((e) => ({
            ...e,
            flaggedAsFraud: e.flaggedAsFraud || extraFlagged.has(e.id),
            payoutStatus: paidEventIds.has(e.id) ? ('paid' as const) : e.payoutStatus,
        }));
    }, [extraFlagged, paidEventIds]);

    const suspicions = useMemo(() => buildSuspicionMap(events), [events]);

    return (
        <div className="space-y-5">
            <div className="flex items-baseline justify-between gap-3">
                <div>
                    <h2 className="text-foreground text-xl font-semibold">Affiliation</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {events.length} conversions sur 90 j · {mockPayouts.length} payouts · anti-fraude actif.
                    </p>
                </div>
            </div>

            <GovernanceBanner />
            <NonNegotiableBanner rule="Aucun payout ne peut être versé tant qu'un événement reste flaggé fraude. Chaque modification de taux et chaque réconciliation est audit-loguée et irréversible." />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Synthèse</TabsTrigger>
                    <TabsTrigger value="events">Événements</TabsTrigger>
                    <TabsTrigger value="payouts">Payouts</TabsTrigger>
                    <TabsTrigger value="rates">Taux</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-5 pt-2">
                    <OverviewTab events={events} />
                </TabsContent>
                <TabsContent value="events" className="space-y-5 pt-2">
                    <EventsTab
                        events={events}
                        suspicions={suspicions}
                        onFlagFraud={(id) => setExtraFlagged((prev) => new Set(prev).add(id))}
                    />
                </TabsContent>
                <TabsContent value="payouts" className="space-y-5 pt-2">
                    <PayoutsTab
                        events={events}
                        suspicions={suspicions}
                        bankStatuses={bankStatuses}
                        onUpdateBankStatus={(id, status) =>
                            setBankStatuses((prev) => {
                                const next = new Map(prev);
                                next.set(id, status);
                                return next;
                            })
                        }
                        onPreparePayout={(eventIds) =>
                            setPaidEventIds((prev) => {
                                const next = new Set(prev);
                                for (const id of eventIds) next.add(id);
                                return next;
                            })
                        }
                    />
                </TabsContent>
                <TabsContent value="rates" className="space-y-5 pt-2">
                    <RatesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function OverviewTab({ events }: { events: readonly AffiliationEvent[] }) {
    const stats = useMemo(() => {
        const last30 = events.filter((e) => NOW_REF - new Date(e.occurredAt).getTime() < 30 * 86_400_000);
        const purchases = last30.filter((e) => e.kind === 'purchase');
        const repairs = last30.filter((e) => e.kind === 'repair_booking');
        const purchaseEur = purchases.reduce((s, e) => s + e.commission.amountEur, 0);
        const repairEur = repairs.reduce((s, e) => s + e.commission.amountEur, 0);
        const conversions = last30.length;
        const mockScans = 1200;
        const transformPct = (conversions / mockScans) * 100;

        const byArtisan = new Map<string, { eur: number; events: number }>();
        for (const e of events) {
            if (e.beneficiaryKind !== 'artisan') continue;
            const cur = byArtisan.get(e.beneficiaryId) ?? { eur: 0, events: 0 };
            cur.eur += e.commission.amountEur;
            cur.events += 1;
            byArtisan.set(e.beneficiaryId, cur);
        }
        const topArtisans = Array.from(byArtisan.entries())
            .sort((a, b) => b[1].eur - a[1].eur)
            .slice(0, 5);

        const byRepairer = new Map<string, { eur: number; events: number }>();
        for (const e of events) {
            if (e.beneficiaryKind !== 'repairer') continue;
            const cur = byRepairer.get(e.beneficiaryId) ?? { eur: 0, events: 0 };
            cur.eur += e.commission.amountEur;
            cur.events += 1;
            byRepairer.set(e.beneficiaryId, cur);
        }
        const topRepairers = Array.from(byRepairer.entries())
            .sort((a, b) => b[1].eur - a[1].eur)
            .slice(0, 5);

        return {
            purchaseEur,
            repairEur,
            totalEur: purchaseEur + repairEur,
            conversions,
            transformPct,
            mockScans,
            purchaseCount: purchases.length,
            repairCount: repairs.length,
            topArtisans,
            topRepairers,
        };
    }, [events]);

    const config = {
        purchaseEur: { label: 'Achats', color: 'var(--lumiris-emerald)' },
        repairEur: { label: 'Retouches', color: 'var(--lumiris-cyan)' },
    } satisfies ChartConfig;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3 lg:grid-cols-4"
            >
                <KpiCard
                    label="Commissions 30j"
                    value={`${stats.totalEur.toFixed(1)} €`}
                    sub={`${stats.purchaseCount} achats · ${stats.repairCount} retouches`}
                    icon={<Coins className="h-4 w-4" />}
                    tone="text-lumiris-emerald"
                />
                <KpiCard
                    label="Conversions 30j"
                    value={stats.conversions.toString()}
                    icon={<BadgeCheck className="h-4 w-4" />}
                    tone="text-lumiris-cyan"
                />
                <KpiCard
                    label="Taux transformation"
                    value={`${stats.transformPct.toFixed(2)} %`}
                    sub={`${stats.mockScans} scans / 30j`}
                    icon={<TrendingUp className="h-4 w-4" />}
                    tone="text-lumiris-amber"
                />
                <KpiCard
                    label="Bénéficiaires actifs"
                    value={`${stats.topArtisans.length + stats.topRepairers.length}`}
                    icon={<Users className="h-4 w-4" />}
                    tone="text-lumiris-rose"
                />
            </motion.div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SplitColumn
                    icon={<Coins className="h-4 w-4" />}
                    tone="text-lumiris-emerald"
                    title="Achat artisan"
                    subtitle="Commission côté vendeur — jamais facturée à l’utilisateur"
                    totalEur={stats.purchaseEur}
                    count={stats.purchaseCount}
                    top={stats.topArtisans.map(([id, info]) => ({
                        id,
                        name: mockArtisans.find((a) => a.id === id)?.atelierName ?? id,
                        eur: info.eur,
                        events: info.events,
                    }))}
                />
                <SplitColumn
                    icon={<Wrench className="h-4 w-4" />}
                    tone="text-lumiris-cyan"
                    title="Retouche / réparation"
                    subtitle="Forfait ou % du devis, à la charge du pro"
                    totalEur={stats.repairEur}
                    count={stats.repairCount}
                    top={stats.topRepairers.map(([id, info]) => {
                        const r = mockRepairers.find((rt) => rt.id === id);
                        return {
                            id,
                            name: r?.atelierName ?? r?.displayName ?? id,
                            eur: info.eur,
                            events: info.events,
                        };
                    })}
                />
            </div>

            <div className="border-border bg-card rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-foreground text-sm font-medium">Commissions par mois — 6 mois</p>
                    <Badge variant="outline" className="font-mono text-[10px]">
                        empilé achat / retouche
                    </Badge>
                </div>
                <ChartContainer config={config} className="h-56 w-full">
                    <BarChart data={mockAffiliationTrajectory.map((p) => ({ ...p }))}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} />
                        <YAxis tickLine={false} axisLine={false} fontSize={10} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="purchaseEur" stackId="a" fill="var(--color-purchaseEur)" />
                        <Bar dataKey="repairEur" stackId="a" fill="var(--color-repairEur)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </div>
        </>
    );
}

interface TopEntry {
    id: string;
    name: string;
    eur: number;
    events: number;
}

function SplitColumn({
    icon,
    tone,
    title,
    subtitle,
    totalEur,
    count,
    top,
}: {
    icon: React.ReactNode;
    tone: string;
    title: string;
    subtitle: string;
    totalEur: number;
    count: number;
    top: readonly TopEntry[];
}) {
    return (
        <section className="border-border bg-card rounded-xl border p-4">
            <header className="flex items-baseline justify-between">
                <div>
                    <p className="text-foreground inline-flex items-center gap-2 text-sm font-semibold">
                        <span className={cn('opacity-80', tone)}>{icon}</span> {title}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">{subtitle}</p>
                </div>
                <div className="text-right">
                    <p className={cn('font-mono text-lg font-bold', tone)}>{totalEur.toFixed(1)} €</p>
                    <p className="text-muted-foreground text-[10px]">{count} events / 30j</p>
                </div>
            </header>
            <div className="border-border my-3 border-t" />
            <p className="text-muted-foreground mb-1.5 text-[10px] uppercase tracking-wider">Top 5 contributeurs</p>
            <ul className="space-y-1.5 text-[11px]">
                {top.length === 0 ? (
                    <li className="text-muted-foreground italic">Aucune contribution sur la période.</li>
                ) : (
                    top.map((entry) => (
                        <li key={entry.id} className="flex items-center justify-between">
                            <span className="text-foreground truncate">{entry.name}</span>
                            <span className="text-muted-foreground font-mono">
                                {entry.eur.toFixed(1)} € · {entry.events} ev.
                            </span>
                        </li>
                    ))
                )}
            </ul>
        </section>
    );
}

function EventsTab({
    events,
    suspicions,
    onFlagFraud,
}: {
    events: readonly AffiliationEvent[];
    suspicions: Map<string, SuspiciousFlag>;
    onFlagFraud: (id: string) => void;
}) {
    const log = useLogAction();
    const canAuditLog = usePermission('governance.read_audit_log');

    const [kindFilter, setKindFilter] = useState<AffiliationKind | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<AffiliationPayoutStatus | 'all'>('all');
    const [fraudFilter, setFraudFilter] = useState<FraudFilter>('all');
    const [beneficiaryFilter, setBeneficiaryFilter] = useState<string>('all');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [target, setTarget] = useState<AffiliationEvent | null>(null);
    const [reason, setReason] = useState('');
    const [typedBeneficiary, setTypedBeneficiary] = useState('');
    const [statusAnnouncement, setStatusAnnouncement] = useState('');

    const beneficiaries = useMemo(() => {
        const set = new Set<string>();
        for (const e of events) set.add(e.beneficiaryId);
        return Array.from(set).sort();
    }, [events]);

    const filtered = useMemo(() => {
        const min = minAmount ? Number(minAmount) : undefined;
        const max = maxAmount ? Number(maxAmount) : undefined;
        return events.filter((e) => {
            if (kindFilter !== 'all' && e.kind !== kindFilter) return false;
            if (statusFilter !== 'all' && e.payoutStatus !== statusFilter) return false;
            if (beneficiaryFilter !== 'all' && e.beneficiaryId !== beneficiaryFilter) return false;
            if (min !== undefined && e.commission.amountEur < min) return false;
            if (max !== undefined && e.commission.amountEur > max) return false;
            if (!matchesFraudFilter(e, suspicions, fraudFilter)) return false;
            return true;
        });
    }, [events, kindFilter, statusFilter, beneficiaryFilter, minAmount, maxAmount, fraudFilter, suspicions]);

    const suspiciousEvents = useMemo(
        () => events.filter((e) => suspicions.has(e.id) && !e.flaggedAsFraud),
        [events, suspicions],
    );

    const pagination = usePagination(filtered, 100);

    const handleConfirmFraud = () => {
        if (!target) return;
        if (reason.trim().length === 0) return;
        if (typedBeneficiary.trim() !== target.beneficiaryDisplayName) return;
        const flag = suspicions.get(target.id);
        const entry = log({
            action: 'governance.read_audit_log',
            targetType: 'affiliation_event',
            targetId: target.id,
            payload: {
                decision: 'flagged_as_fraud',
                reason: reason || 'manual review',
                kind: target.kind,
                beneficiary: target.beneficiaryId,
                amount: target.commission.amountEur,
                pattern: flag?.burst ? 'burst' : flag?.selfBooking ? 'self_booking' : flag?.geo ? 'geo' : 'manual',
            },
        });
        onFlagFraud(target.id);
        setStatusAnnouncement(
            `Commission marquée frauduleuse pour ${target.beneficiaryDisplayName} — audit log ${entry.id} créé.`,
        );
        setTarget(null);
        setReason('');
        setTypedBeneficiary('');
    };

    return (
        <>
            {suspiciousEvents.length > 0 ? <SuspiciousPanel events={suspiciousEvents} suspicions={suspicions} /> : null}

            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as typeof kindFilter)}>
                    <SelectTrigger className="w-40">
                        <Filter className="mr-1 h-3.5 w-3.5" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous types</SelectItem>
                        <SelectItem value="purchase">Achat</SelectItem>
                        <SelectItem value="repair_booking">Retouche</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous payouts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={fraudFilter} onValueChange={(v) => setFraudFilter(v as FraudFilter)}>
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous événements</SelectItem>
                        <SelectItem value="self-booking">Auto-réservation</SelectItem>
                        <SelectItem value="burst">Pic d&apos;activité</SelectItem>
                        <SelectItem value="geo">Géo incohérente</SelectItem>
                        <SelectItem value="flagged">Déjà signalés</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={beneficiaryFilter} onValueChange={setBeneficiaryFilter}>
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous bénéficiaires</SelectItem>
                        {beneficiaries.map((b) => (
                            <SelectItem key={b} value={b}>
                                {b}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    placeholder="Min €"
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-24"
                />
                <Input
                    placeholder="Max €"
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-24"
                />
                <p className="text-muted-foreground ml-auto text-[10px]">
                    Anonymisation auto · {ANONYMISATION_THRESHOLD_DAYS} jours
                </p>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={Filter}
                    title="Aucun événement ne correspond aux filtres"
                    description="Élargissez la période ou désactivez le filtre fraude pour explorer le journal."
                    action={
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setKindFilter('all');
                                setStatusFilter('all');
                                setFraudFilter('all');
                                setBeneficiaryFilter('all');
                                setMinAmount('');
                                setMaxAmount('');
                            }}
                            className="gap-1.5"
                        >
                            <Filter className="h-3.5 w-3.5" aria-hidden /> Réinitialiser les filtres
                        </Button>
                    }
                />
            ) : null}

            <div className="border-border bg-card overflow-hidden rounded-xl border" hidden={filtered.length === 0}>
                <Table>
                    <TableHeader stickyHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Bénéficiaire</TableHead>
                            <TableHead className="text-right">Transaction</TableHead>
                            <TableHead className="text-right">Commission</TableHead>
                            <TableHead>Payout</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pagination.pageItems.map((e) => {
                            const flag = suspicions.get(e.id);
                            const userLabel = anonymiseUserId(e.userId, e.occurredAt);
                            const kindTone =
                                e.kind === 'purchase'
                                    ? 'border-lumiris-emerald/40 text-lumiris-emerald'
                                    : 'border-lumiris-cyan/40 text-lumiris-cyan';
                            return (
                                <TableRow
                                    key={e.id}
                                    className={cn(
                                        flag?.selfBooking ? 'bg-lumiris-rose/5' : '',
                                        flag?.burst ? 'bg-lumiris-amber/5' : '',
                                        flag?.geo ? 'bg-lumiris-amber/5' : '',
                                        e.flaggedAsFraud ? 'opacity-50' : '',
                                    )}
                                >
                                    <TableCell className="font-mono text-[11px]">
                                        {new Date(e.occurredAt).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('font-mono text-[10px]', kindTone)}>
                                            {e.kind === 'purchase' ? 'Achat' : 'Retouche'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-[11px]">{userLabel}</TableCell>
                                    <TableCell>
                                        <p className="text-foreground text-sm">{e.beneficiaryDisplayName}</p>
                                        <p className="text-muted-foreground text-[10px]">{e.beneficiaryId}</p>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {e.transactionAmountEur} €
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-foreground font-mono text-sm">
                                            {e.commission.amountEur.toFixed(2)} €
                                        </span>
                                        <span className="text-muted-foreground/70 ml-1 text-[10px]">
                                            {e.commission.type === 'pct' ? `${e.commission.percent}%` : 'forfait'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {e.flaggedAsFraud ? (
                                            <Badge
                                                variant="outline"
                                                className="border-lumiris-rose/40 text-lumiris-rose font-mono text-[10px]"
                                            >
                                                <ShieldOff className="mr-1 h-2.5 w-2.5" /> Annulé
                                            </Badge>
                                        ) : (
                                            <PayoutBadge status={e.payoutStatus} />
                                        )}
                                        {flag?.burst ? (
                                            <Badge
                                                variant="outline"
                                                className="border-lumiris-amber/40 text-lumiris-amber ml-1 font-mono text-[10px]"
                                            >
                                                {flag.burst.count}/{flag.burst.windowMinutes}min
                                            </Badge>
                                        ) : null}
                                        {flag?.selfBooking ? (
                                            <Badge
                                                variant="outline"
                                                className="border-lumiris-rose/40 text-lumiris-rose ml-1 font-mono text-[10px]"
                                            >
                                                auto-RDV
                                            </Badge>
                                        ) : null}
                                        {flag?.geo ? (
                                            <Badge
                                                variant="outline"
                                                className="border-lumiris-amber/40 text-lumiris-amber ml-1 font-mono text-[10px]"
                                            >
                                                <MapPin className="mr-1 h-2.5 w-2.5" />
                                                {flag.geo.distanceKm} km
                                            </Badge>
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!e.flaggedAsFraud && canAuditLog ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setTarget(e)}
                                                className="gap-1.5"
                                            >
                                                <Flag className="h-3 w-3" /> Frauduleux
                                            </Button>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-muted-foreground py-8 text-center text-xs">
                                    Aucun événement ne correspond aux filtres.
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
                {filtered.length > 0 ? (
                    <PaginationBar
                        page={pagination.page}
                        pageCount={pagination.pageCount}
                        pageSize={pagination.pageSize}
                        rangeStart={pagination.rangeStart}
                        rangeEnd={pagination.rangeEnd}
                        totalCount={filtered.length}
                        onPageChange={pagination.setPage}
                        label="événements"
                    />
                ) : null}
            </div>

            <AlertDialog
                open={target !== null}
                onOpenChange={(o) => {
                    if (!o) {
                        setTarget(null);
                        setReason('');
                        setTypedBeneficiary('');
                    }
                }}
            >
                <AlertDialogContent aria-describedby="affiliation-fraud-description">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Annuler la commission ?</AlertDialogTitle>
                        <AlertDialogDescription id="affiliation-fraud-description">
                            La commission de {target?.commission.amountEur.toFixed(2)} € pour{' '}
                            <strong>{target?.beneficiaryDisplayName}</strong> sera annulée. L&apos;action est tracée —
                            précisez la raison ci-dessous puis confirmez en re-tapant le nom du bénéficiaire.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Raison (ex. user_anon générant 6 conversions / 10 min)"
                            aria-label="Raison du flag fraude"
                            aria-describedby="affiliation-fraud-description"
                        />
                        {target ? (
                            <Input
                                value={typedBeneficiary}
                                onChange={(e) => setTypedBeneficiary(e.target.value)}
                                placeholder={target.beneficiaryDisplayName}
                                aria-label={`Tapez ${target.beneficiaryDisplayName} pour confirmer`}
                                aria-describedby="affiliation-fraud-description"
                            />
                        ) : null}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={
                                !target ||
                                reason.trim().length === 0 ||
                                typedBeneficiary.trim() !== target.beneficiaryDisplayName
                            }
                            onClick={handleConfirmFraud}
                        >
                            Marquer frauduleux
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {statusAnnouncement}
            </div>
        </>
    );
}

function PayoutBadge({ status }: { status: AffiliationPayoutStatus }) {
    const tone =
        status === 'paid'
            ? 'border-lumiris-emerald/40 text-lumiris-emerald'
            : status === 'cancelled'
              ? 'border-lumiris-rose/40 text-lumiris-rose'
              : 'border-lumiris-cyan/40 text-lumiris-cyan';
    const label = status === 'paid' ? 'Payé' : status === 'cancelled' ? 'Annulé' : 'En attente';
    return (
        <Badge variant="outline" className={cn('font-mono text-[10px]', tone)}>
            {label}
        </Badge>
    );
}

function SuspiciousPanel({
    events,
    suspicions,
}: {
    events: readonly AffiliationEvent[];
    suspicions: Map<string, SuspiciousFlag>;
}) {
    const burst = events.filter((e) => suspicions.get(e.id)?.burst);
    const selfBooking = events.filter((e) => suspicions.get(e.id)?.selfBooking);
    const geo = events.filter((e) => suspicions.get(e.id)?.geo);
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-lumiris-amber/30 bg-lumiris-amber/5 space-y-2 rounded-xl border p-4"
        >
            <div className="text-lumiris-amber inline-flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" /> Patterns suspects à investiguer
            </div>
            {burst.length > 0 ? (
                <p className="text-muted-foreground text-xs">
                    <strong className="text-foreground">{burst.length} événements</strong> où un même utilisateur génère
                    plus de 5 conversions sur 10 minutes.
                </p>
            ) : null}
            {selfBooking.length > 0 ? (
                <p className="text-muted-foreground text-xs">
                    <strong className="text-foreground">{selfBooking.length} auto-réservations</strong> —
                    l&apos;utilisateur est identique au bénéficiaire.
                </p>
            ) : null}
            {geo.length > 0 ? (
                <p className="text-muted-foreground text-xs">
                    <strong className="text-foreground">{geo.length} géo-anomalies</strong> — 2 events &gt; 500 km en
                    moins d&apos;une heure pour le même userId.
                </p>
            ) : null}
        </motion.div>
    );
}

function PayoutsTab({
    events,
    suspicions,
    bankStatuses,
    onUpdateBankStatus,
    onPreparePayout,
}: {
    events: readonly AffiliationEvent[];
    suspicions: Map<string, SuspiciousFlag>;
    bankStatuses: Map<string, BankStatus>;
    onUpdateBankStatus: (id: string, status: BankStatus) => void;
    onPreparePayout: (eventIds: readonly string[]) => void;
}) {
    const log = useLogAction();
    const canPrepare = usePermission('affiliation.prepare_payout');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [openPayout, setOpenPayout] = useState<Payout | null>(null);

    const currentPeriodEvents = useMemo(() => {
        return events.filter((e) => e.payoutStatus === 'pending');
    }, [events]);

    const stats = useMemo(() => {
        const eligible = currentPeriodEvents.filter((e) => !e.flaggedAsFraud && !suspicions.has(e.id));
        const excluded = currentPeriodEvents.filter((e) => e.flaggedAsFraud || suspicions.has(e.id));
        const total = eligible.reduce((s, e) => s + e.commission.amountEur, 0);
        const beneficiaries = new Set(eligible.map((e) => e.beneficiaryId));
        return {
            eligible,
            excluded,
            total,
            beneficiaryCount: beneficiaries.size,
        };
    }, [currentPeriodEvents, suspicions]);

    const handleConfirm = () => {
        const month = '2026-04';
        log({
            action: 'affiliation.prepare_payout',
            targetType: 'period',
            targetId: month,
            payload: {
                mois: month,
                totalEuros: +stats.total.toFixed(2),
                nbBeneficiaires: stats.beneficiaryCount,
                exclusions: stats.excluded.map((e) => e.id),
            },
        });

        if (typeof window !== 'undefined') {
            const header = ['eventId', 'beneficiaryId', 'beneficiaryName', 'kind', 'amountEur'].join(',');
            const lines = stats.eligible.map((e) =>
                [e.id, e.beneficiaryId, e.beneficiaryDisplayName, e.kind, e.commission.amountEur.toFixed(2)]
                    .map((v) => String(v).replace(/,/g, ';'))
                    .join(','),
            );
            const csv = `${header}\n${lines.join('\n')}`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lumiris-payout-${month}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }

        onPreparePayout(stats.eligible.map((e) => e.id));
        setConfirmOpen(false);
    };

    const handleReconcile = (payout: Payout) => {
        onUpdateBankStatus(payout.id, 'reconciled');
        log({
            action: 'affiliation.payout_reconcile',
            targetType: 'payout',
            targetId: payout.id,
            payload: {
                period: payout.period,
                totalEur: payout.totalEur,
                beneficiaryCount: payout.beneficiaryCount,
                previousStatus: bankStatuses.get(payout.id) ?? 'awaiting',
                newStatus: 'reconciled',
            },
        });
    };

    const beneficiariesForPayout = useMemo(() => {
        if (!openPayout) return [];
        const periodEvents = events.filter(
            (e) => new Date(e.occurredAt).toISOString().slice(0, 7) === openPayout.period,
        );
        const map = new Map<string, { name: string; total: number; count: number }>();
        for (const e of periodEvents) {
            const cur = map.get(e.beneficiaryId) ?? { name: e.beneficiaryDisplayName, total: 0, count: 0 };
            cur.total += e.commission.amountEur;
            cur.count += 1;
            map.set(e.beneficiaryId, cur);
        }
        return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
    }, [openPayout, events]);

    return (
        <>
            <div className="border-border bg-card rounded-xl border p-5">
                <div className="flex items-baseline justify-between gap-3">
                    <div>
                        <p className="text-foreground text-sm font-semibold">Mois en cours — avril 2026</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {stats.beneficiaryCount} bénéficiaires · {stats.eligible.length} événements éligibles ·{' '}
                            {stats.excluded.length} exclusions suspectes.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        disabled={!canPrepare || stats.eligible.length === 0}
                        onClick={() => setConfirmOpen(true)}
                        className="gap-1.5"
                    >
                        <ArrowDownToLine className="h-3.5 w-3.5" /> Préparer le payout
                    </Button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                    <Stat label="À payer" value={`${stats.total.toFixed(2)} €`} tone="text-lumiris-emerald" />
                    <Stat label="Bénéficiaires" value={stats.beneficiaryCount.toString()} tone="text-lumiris-cyan" />
                    <Stat
                        label="Exclus"
                        value={`${stats.excluded.length}`}
                        sub={`${stats.excluded.reduce((s, e) => s + e.commission.amountEur, 0).toFixed(2)} €`}
                        tone="text-lumiris-rose"
                    />
                </div>
            </div>

            <div className="border-border bg-card overflow-hidden rounded-xl border">
                <div className="border-border flex items-center gap-2 border-b px-4 py-2.5">
                    <Landmark className="text-muted-foreground h-3.5 w-3.5" />
                    <p className="text-muted-foreground text-xs">
                        Historique payouts · statut bancaire ligne par ligne
                    </p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Période</TableHead>
                            <TableHead>Statut bancaire</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead className="text-right">Bénéficiaires</TableHead>
                            <TableHead>Préparé le</TableHead>
                            <TableHead>Date prévue</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockPayouts.map((p) => {
                            const status = bankStatuses.get(p.id) ?? inferBankStatus(p);
                            const expected = inferExpectedDate(p);
                            return (
                                <TableRow key={p.id}>
                                    <TableCell className="font-mono text-sm">{p.period}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('font-mono text-[10px]', BANK_STATUS_TONE[status])}
                                        >
                                            {BANK_STATUS_LABEL[status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {p.totalEur.toFixed(2)} €
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">{p.beneficiaryCount}</TableCell>
                                    <TableCell className="font-mono text-[11px]">
                                        {p.preparedAt ? new Date(p.preparedAt).toLocaleDateString('fr-FR') : '—'}
                                    </TableCell>
                                    <TableCell className="font-mono text-[11px]">
                                        {new Date(expected).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center justify-end gap-1.5">
                                            {status !== 'reconciled' && canPrepare ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReconcile(p)}
                                                    className="gap-1.5"
                                                >
                                                    <CheckCircle2 className="h-3 w-3" /> Marquer réconcilié
                                                </Button>
                                            ) : null}
                                            <Button size="sm" variant="ghost" onClick={() => setOpenPayout(p)}>
                                                Détail
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Préparer le payout — avril 2026</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <span className="block">
                                <strong>{stats.beneficiaryCount} bénéficiaires</strong> ·{' '}
                                <strong>{stats.total.toFixed(2)} €</strong> à payer.
                            </span>
                            <span className="block">
                                {stats.excluded.length} événement(s) seront <strong>exclus</strong> pour patterns
                                suspects ou flag manuel.
                            </span>
                            <span className="block text-xs">
                                Les événements éligibles passeront en{' '}
                                <code className="bg-muted rounded px-1">paid</code> et un CSV sera téléchargé.
                                L&apos;action est tracée dans l&apos;audit log.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>Confirmer &amp; télécharger CSV</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={openPayout !== null} onOpenChange={(o) => !o && setOpenPayout(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Détail payout {openPayout?.period}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {openPayout?.totalEur.toFixed(2)} € versés à {openPayout?.beneficiaryCount} bénéficiaires.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-72 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bénéficiaire</TableHead>
                                    <TableHead className="text-right">Conversions</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {beneficiariesForPayout.map(([id, info]) => (
                                    <TableRow key={id}>
                                        <TableCell>
                                            <p className="text-foreground text-sm">{info.name}</p>
                                            <p className="text-muted-foreground text-[10px]">{id}</p>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{info.count}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {info.total.toFixed(2)} €
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {beneficiariesForPayout.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="text-muted-foreground py-4 text-center text-xs"
                                        >
                                            Aucun bénéficiaire pour cette période.
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setOpenPayout(null)}>Fermer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
    return (
        <div className="border-border bg-background rounded-lg border p-3">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
            <p className={cn('mt-0.5 font-mono text-lg font-bold', tone)}>{value}</p>
            {sub ? <p className="text-muted-foreground text-[10px]">{sub}</p> : null}
        </div>
    );
}

function RatesTab() {
    const canWriteRates = usePermission('affiliation.rate_change');
    if (!canWriteRates) {
        return (
            <div className="border-border bg-muted/30 text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
                <p className="text-foreground font-medium">Accès restreint</p>
                <p className="mt-0.5 text-xs">
                    L&apos;édition des taux nécessite la permission <code className="font-mono">affiliation.write</code>{' '}
                    (équivalent <code className="font-mono">affiliation.prepare_payout</code> dans la matrice actuelle).
                </p>
            </div>
        );
    }
    return <RatesEditor />;
}

interface PendingRateChange {
    kind: 'purchase' | 'repair-flat' | 'repair-pct' | 'repair-mode';
    label: string;
    oldValue: string;
    newValue: string;
    apply: () => void;
}

function RatesEditor() {
    const log = useLogAction();
    const [purchaseRates, setPurchaseRates] = useState<readonly PurchaseRate[]>(DEFAULT_PURCHASE_RATES);
    const [repair, setRepair] = useState<RepairCommission>(DEFAULT_REPAIR_COMMISSION);
    const [purchaseDrafts, setPurchaseDrafts] = useState<Record<ProductCategory, string>>(() => {
        return Object.fromEntries(DEFAULT_PURCHASE_RATES.map((r) => [r.category, String(r.percent)])) as Record<
            ProductCategory,
            string
        >;
    });
    const [repairDrafts, setRepairDrafts] = useState({
        mode: DEFAULT_REPAIR_COMMISSION.mode,
        flat: String(DEFAULT_REPAIR_COMMISSION.flatEur),
        pct: String(DEFAULT_REPAIR_COMMISSION.pct),
    });
    const [reason, setReason] = useState('');
    const [pending, setPending] = useState<PendingRateChange | null>(null);

    const reasonTooShort = reason.trim().length < RATE_CHANGE_REASON_MIN_LENGTH;

    const auditAndApply = (change: PendingRateChange) => {
        log({
            action: 'affiliation.rate_change',
            targetType: 'affiliation_rate',
            targetId: change.kind,
            payload: {
                kind: change.kind,
                label: change.label,
                oldValue: change.oldValue,
                newValue: change.newValue,
                reason: reason.trim(),
            },
        });
        change.apply();
        setPending(null);
        setReason('');
    };

    const handlePurchaseSubmit = (rate: PurchaseRate) => {
        const draft = Number(purchaseDrafts[rate.category]);
        const error = validatePurchaseRate(draft);
        if (error) return;
        if (draft === rate.percent) return;
        setPending({
            kind: 'purchase',
            label: `Achat — ${rate.label}`,
            oldValue: `${rate.percent} %`,
            newValue: `${draft} %`,
            apply: () => {
                setPurchaseRates((prev) =>
                    prev.map((r) => (r.category === rate.category ? { ...r, percent: draft } : r)),
                );
            },
        });
    };

    const handleRepairSubmit = () => {
        const flatDraft = Number(repairDrafts.flat);
        const pctDraft = Number(repairDrafts.pct);
        const flatError = validateRepairFlat(flatDraft);
        const pctError = validateRepairPct(pctDraft);
        if (repairDrafts.mode === 'flat' && flatError) return;
        if (repairDrafts.mode === 'pct' && pctError) return;
        const oldDesc = repair.mode === 'flat' ? `${repair.flatEur} € forfait` : `${repair.pct} % du devis`;
        const newDesc = repairDrafts.mode === 'flat' ? `${flatDraft} € forfait` : `${pctDraft} % du devis`;
        if (oldDesc === newDesc) return;
        setPending({
            kind: repairDrafts.mode === 'flat' ? 'repair-flat' : 'repair-pct',
            label: 'Retouche / réparation',
            oldValue: oldDesc,
            newValue: newDesc,
            apply: () => {
                setRepair({ mode: repairDrafts.mode, flatEur: flatDraft, pct: pctDraft });
            },
        });
    };

    return (
        <>
            <div className="border-lumiris-emerald/20 bg-lumiris-emerald/5 rounded-xl border p-4 text-xs">
                <p className="text-foreground inline-flex items-center gap-2 font-semibold">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Éditeur de taux
                </p>
                <p className="text-muted-foreground mt-1">
                    Bornes légales : achat {PURCHASE_RATE_BOUNDS.min}-{PURCHASE_RATE_BOUNDS.max} % · retouche{' '}
                    {REPAIR_FLAT_BOUNDS.min}-{REPAIR_FLAT_BOUNDS.max} € ou {REPAIR_PCT_BOUNDS.min}-
                    {REPAIR_PCT_BOUNDS.max} %. Toute modification est audit-loguée (
                    <code className="font-mono">affiliation.rate_change</code>) et requiert une raison ≥{' '}
                    {RATE_CHANGE_REASON_MIN_LENGTH} caractères.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section className="border-border bg-card rounded-xl border p-4">
                    <header className="mb-3">
                        <p className="text-foreground text-sm font-semibold">Achat — par catégorie produit</p>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">
                            Commission côté marchand. Borne {PURCHASE_RATE_BOUNDS.min}-{PURCHASE_RATE_BOUNDS.max} %.
                        </p>
                    </header>
                    <ul className="divide-border divide-y">
                        {purchaseRates.map((rate) => (
                            <PurchaseRow
                                key={rate.category}
                                rate={rate}
                                draft={purchaseDrafts[rate.category]}
                                onDraftChange={(v) => setPurchaseDrafts((prev) => ({ ...prev, [rate.category]: v }))}
                                onSubmit={() => handlePurchaseSubmit(rate)}
                            />
                        ))}
                    </ul>
                </section>

                <section className="border-border bg-card rounded-xl border p-4">
                    <header className="mb-3">
                        <p className="text-foreground text-sm font-semibold">Retouche / réparation</p>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">
                            Forfait {REPAIR_FLAT_BOUNDS.min}-{REPAIR_FLAT_BOUNDS.max} € ou {REPAIR_PCT_BOUNDS.min}-
                            {REPAIR_PCT_BOUNDS.max} % du devis.
                        </p>
                    </header>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Label className="text-foreground text-xs">Mode</Label>
                            <div className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                                <span className={repairDrafts.mode === 'flat' ? 'text-foreground' : ''}>Forfait €</span>
                                <Switch
                                    checked={repairDrafts.mode === 'pct'}
                                    onCheckedChange={(checked) =>
                                        setRepairDrafts((prev) => ({ ...prev, mode: checked ? 'pct' : 'flat' }))
                                    }
                                />
                                <span className={repairDrafts.mode === 'pct' ? 'text-foreground' : ''}>% du devis</span>
                            </div>
                        </div>
                        {repairDrafts.mode === 'flat' ? (
                            <RateInput
                                label="Forfait par retouche"
                                value={repairDrafts.flat}
                                suffix="€"
                                onChange={(v) => setRepairDrafts((prev) => ({ ...prev, flat: v }))}
                                error={validateRepairFlat(Number(repairDrafts.flat))?.message}
                            />
                        ) : (
                            <RateInput
                                label="Pourcentage du devis"
                                value={repairDrafts.pct}
                                suffix="%"
                                onChange={(v) => setRepairDrafts((prev) => ({ ...prev, pct: v }))}
                                error={validateRepairPct(Number(repairDrafts.pct))?.message}
                            />
                        )}
                        <Button size="sm" onClick={handleRepairSubmit}>
                            Proposer la modification
                        </Button>
                    </div>
                </section>
            </div>

            <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Modifier le taux — {pending?.label}</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="block">
                                <strong>{pending?.oldValue}</strong> → <strong>{pending?.newValue}</strong>
                            </span>
                            <span className="text-muted-foreground mt-2 block text-xs">
                                Cette modification est tracée dans le journal d&apos;audit. Précisez la raison (≥{' '}
                                {RATE_CHANGE_REASON_MIN_LENGTH} caractères).
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Justification métier (ex. alignement avec la grille tarifaire 2026 votée le 12 mai…)"
                        className="mt-2 min-h-24"
                    />
                    <p className={cn('text-[11px]', reasonTooShort ? 'text-lumiris-rose' : 'text-lumiris-emerald')}>
                        {reason.trim().length} / {RATE_CHANGE_REASON_MIN_LENGTH} caractères
                    </p>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={reasonTooShort || pending === null}
                            onClick={() => pending && auditAndApply(pending)}
                        >
                            Confirmer la modification
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function PurchaseRow({
    rate,
    draft,
    onDraftChange,
    onSubmit,
}: {
    rate: PurchaseRate;
    draft: string;
    onDraftChange: (v: string) => void;
    onSubmit: () => void;
}) {
    const draftNum = Number(draft);
    const error = validatePurchaseRate(draftNum);
    const dirty = draftNum !== rate.percent && !Number.isNaN(draftNum);
    return (
        <li className="flex items-center justify-between gap-3 py-2.5">
            <div>
                <p className="text-foreground text-sm">{rate.label}</p>
                <p className="text-muted-foreground text-[10px]">Taux courant : {rate.percent} %</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Input
                        type="number"
                        step="0.5"
                        min={PURCHASE_RATE_BOUNDS.min}
                        max={PURCHASE_RATE_BOUNDS.max}
                        value={draft}
                        onChange={(e) => onDraftChange(e.target.value)}
                        className={cn(
                            'w-24 pr-7 font-mono text-sm',
                            error ? 'border-lumiris-rose/60 focus-visible:ring-lumiris-rose/30' : '',
                        )}
                    />
                    <span className="text-muted-foreground pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px]">
                        %
                    </span>
                </div>
                <Button size="sm" disabled={!dirty || error !== null} onClick={onSubmit}>
                    Modifier
                </Button>
            </div>
            {error ? <p className="text-lumiris-rose w-full text-right text-[10px]">{error.message}</p> : null}
        </li>
    );
}

function RateInput({
    label,
    value,
    suffix,
    onChange,
    error,
}: {
    label: string;
    value: string;
    suffix: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <div>
            <Label className="text-foreground mb-1.5 text-xs">{label}</Label>
            <div className="relative">
                <Input
                    type="number"
                    step="0.5"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        'w-32 pr-8 font-mono text-sm',
                        error ? 'border-lumiris-rose/60 focus-visible:ring-lumiris-rose/30' : '',
                    )}
                />
                <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px]">
                    {suffix}
                </span>
            </div>
            {error ? <p className="text-lumiris-rose mt-1 text-[10px]">{error}</p> : null}
        </div>
    );
}

export const Affiliation = memo(AffiliationComponent);
