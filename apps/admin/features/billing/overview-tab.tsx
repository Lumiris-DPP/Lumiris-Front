'use client';

import { useMemo, useState } from 'react';
import { mockMrrTrajectory, mockSubscriptions } from '@lumiris/mock-data';
import type { Subscription } from '@lumiris/types';
import { Badge } from '@lumiris/ui/components/badge';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { cn } from '@lumiris/ui/lib/cn';
import { computeBillingKpi } from '@/lib/billing-kpi';
import { PRICE_LINES, formatEur, type PriceLineId } from '@/lib/pricing';
import { EmptyState } from '../_shared/empty-state';
import { statusBadgeProps } from './status';
import { SubscriptionDetailDrawer } from './subscription-detail-drawer';
import type { TierFilterValue } from './types';

const PLAN_OPTIONS: ReadonlyArray<{ value: TierFilterValue; label: string }> = [
    { value: 'all', label: 'Tous plans' },
    { value: 'solo', label: PRICE_LINES.solo.shortLabel },
    { value: 'studio', label: PRICE_LINES.studio.shortLabel },
    { value: 'maison', label: PRICE_LINES.maison.shortLabel },
    { value: 'local', label: PRICE_LINES.local.shortLabel },
];

export function OverviewTab() {
    const kpi = useMemo(() => computeBillingKpi(mockSubscriptions, mockMrrTrajectory), []);
    const [search, setSearch] = useState('');
    const [plan, setPlan] = useState<TierFilterValue>('all');
    const [selected, setSelected] = useState<Subscription | null>(null);

    const subs = useMemo(() => {
        return mockSubscriptions.filter((s) => {
            if (plan !== 'all' && resolvePlanId(s) !== plan) return false;
            if (search.trim() && !s.displayName.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [search, plan]);

    const active = mockSubscriptions.filter((s) => s.status === 'active' || s.status === 'past_due').length;
    const variationPct = kpi.mrr === 0 ? 0 : (kpi.netNew / kpi.mrr) * 100;

    function resetFilters() {
        setSearch('');
        setPlan('all');
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                <KpiTile label="MRR" value={formatEur(kpi.mrr)} variationPct={variationPct} />
                <KpiTile label="Abonnés" value={String(active)} />
                <KpiTile label="Churn" value={`${kpi.churnPct.toFixed(1)} %`} />
            </div>

            <MrrSparkline />

            <DataTableFilters
                search={{ value: search, onChange: setSearch, placeholder: 'Atelier, raison sociale…' }}
                filters={[
                    {
                        label: 'Plan',
                        value: plan,
                        onChange: (v) => setPlan(v as TierFilterValue),
                        options: [...PLAN_OPTIONS],
                    },
                ]}
                onReset={resetFilters}
            />

            {subs.length === 0 ? (
                <EmptyState title="Aucun abonnement." />
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <Table>
                        <TableHeader stickyHeader>
                            <TableRow>
                                <TableHead>Compte</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead className="text-right">Prix mensuel</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Prochaine échéance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subs.map((sub) => (
                                <SubscriptionRow key={sub.id} sub={sub} onSelect={setSelected} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <SubscriptionDetailDrawer subscription={selected} onClose={() => setSelected(null)} />
        </div>
    );
}

function resolvePlanId(sub: Subscription): PriceLineId | 'free' {
    if (sub.subscriberKind === 'repairer') return sub.tier === 'free' ? 'free' : 'local';
    return (sub.artisanTier?.toLowerCase() ?? sub.tier) as PriceLineId;
}

function planLabel(sub: Subscription): string {
    if (sub.subscriberKind === 'repairer') {
        return sub.tier === 'free' ? 'Local (free)' : PRICE_LINES.local.shortLabel;
    }
    return sub.artisanTier ?? sub.tier;
}

function SubscriptionRow({ sub, onSelect }: { sub: Subscription; onSelect: (s: Subscription) => void }) {
    const status = statusBadgeProps(sub.status);
    return (
        <TableRow
            tabIndex={0}
            role="button"
            onClick={() => onSelect(sub)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(sub);
                }
            }}
            className="cursor-pointer hover:bg-muted/40"
        >
            <TableCell>
                <p className="text-sm font-medium text-foreground">{sub.displayName}</p>
                <p className="text-[10px] text-muted-foreground">
                    {sub.subscriberKind === 'artisan' ? 'Artisan' : 'Retoucheur'} · {sub.city}
                </p>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    <Badge variant="outline" className="font-mono text-[10px] capitalize">
                        {planLabel(sub)}
                    </Badge>
                    {sub.plus ? (
                        <Badge
                            variant="outline"
                            className="border-lumiris-iris/40 font-mono text-[10px] text-lumiris-iris"
                        >
                            ATELIER+
                        </Badge>
                    ) : null}
                </div>
            </TableCell>
            <TableCell className="text-right font-mono text-sm">{formatEur(sub.mrrEur)}</TableCell>
            <TableCell>
                <Badge variant={status.variant} className={cn('font-mono text-[10px]', status.className)}>
                    {status.label}
                </Badge>
            </TableCell>
            <TableCell className="font-mono text-[11px]">
                {new Date(sub.nextBillingAt).toLocaleDateString('fr-FR')}
            </TableCell>
        </TableRow>
    );
}

function KpiTile({ label, value, variationPct }: { label: string; value: string; variationPct?: number }) {
    const variation =
        variationPct !== undefined && Math.abs(variationPct) >= 0.05
            ? `${variationPct >= 0 ? '+' : ''}${variationPct.toFixed(1)}%`
            : null;
    const variationTone = variationPct !== undefined && variationPct < 0 ? 'text-lumiris-rose' : 'text-lumiris-emerald';
    return (
        <div className="flex flex-col rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
            {variation ? <p className={cn('mt-0.5 text-[11px]', variationTone)}>{variation}</p> : null}
        </div>
    );
}

function MrrSparkline() {
    const points = useMemo(
        () =>
            mockMrrTrajectory.map((p) => ({
                label: p.label,
                total: p.solo + p.studio + p.maison + p.plus + p.local,
            })),
        [],
    );
    const max = Math.max(...points.map((p) => p.total), 1);
    const min = Math.min(...points.map((p) => p.total), 0);
    const range = Math.max(max - min, 1);
    const w = 280;
    const h = 56;
    const step = points.length > 1 ? w / (points.length - 1) : w;
    const path = points
        .map((p, i) => {
            const x = i * step;
            const y = h - ((p.total - min) / range) * h;
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
            <div>
                <p className="text-sm font-medium text-foreground">MRR · 6 mois</p>
                <p className="text-[11px] text-muted-foreground">
                    {points[0]?.label} → {points[points.length - 1]?.label}
                </p>
            </div>
            <svg width={w} height={h} role="img" aria-label="Sparkline MRR" className="shrink-0">
                <path d={path} fill="none" stroke="var(--lumiris-emerald)" strokeWidth={1.5} />
                {points.map((p, i) => {
                    const x = i * step;
                    const y = h - ((p.total - min) / range) * h;
                    return <circle key={p.label} cx={x} cy={y} r={2} fill="var(--lumiris-emerald)" />;
                })}
            </svg>
        </div>
    );
}
