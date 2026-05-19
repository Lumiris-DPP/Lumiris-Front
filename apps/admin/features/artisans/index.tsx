'use client';

import { memo, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowUpCircle, Filter, Search } from 'lucide-react';
import { mockArtisans, mockPassports, mockRepairers, mockSubscriptions } from '@lumiris/mock-data';
import { type Artisan, type ArtisanTier } from '@lumiris/types';
import { Avatar, AvatarFallback, AvatarImage } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Input } from '@lumiris/ui/components/input';
import { Progress } from '@lumiris/ui/components/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Sheet, SheetContent } from '@lumiris/ui/components/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { useAdminAuditLog } from '@/lib/auth';
import {
    buildArtisanRows,
    computeCohortMetrics,
    listCohortMonths,
    type ArtisanRow,
    type CohortBucketMetrics,
} from '@/lib/artisan-analytics';
import { ArtisanDrawerBody } from './drawer-body';
import { healthBand } from '@/lib/health-score';
import { EmptyState } from '../_shared/empty-state';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';

const SCORING_NOW = new Date('2026-04-30T08:00:00Z');

type HealthFilter = 'all' | 'lt50' | 'gte80capacity';

function ArtisansComponent() {
    return (
        <Suspense fallback={null}>
            <ArtisansInner />
        </Suspense>
    );
}

function ArtisansInner() {
    const params = useSearchParams();
    const deepLinkId = params?.get('id') ?? null;
    const auditLog = useAdminAuditLog();

    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState<ArtisanTier | 'all'>('all');
    const [labelFilter, setLabelFilter] = useState<'all' | 'epv' | 'ofg'>('all');
    const [plusFilter, setPlusFilter] = useState<'all' | 'on' | 'off'>('all');
    const [cohortFilter, setCohortFilter] = useState<string>('all');
    const [healthFilter, setHealthFilter] = useState<HealthFilter>(() =>
        params?.get('filter') === 'inactifs' ? 'lt50' : 'all',
    );
    const [selected, setSelected] = useState<Artisan | null>(null);

    const resetFilters = () => {
        setSearch('');
        setTierFilter('all');
        setLabelFilter('all');
        setPlusFilter('all');
        setCohortFilter('all');
        setHealthFilter('all');
    };

    const rows: readonly ArtisanRow[] = useMemo(
        () => buildArtisanRows(mockArtisans, mockPassports, mockRepairers, auditLog, SCORING_NOW),
        [auditLog],
    );

    const cohortMonths = useMemo(() => listCohortMonths(mockArtisans), []);
    const cohortMetrics = useMemo(() => computeCohortMetrics(mockArtisans, mockSubscriptions, SCORING_NOW), []);

    useEffect(() => {
        if (!deepLinkId) return;
        const found = rows.find((r) => r.artisan.id === deepLinkId);
        if (found) setSelected(found.artisan);
    }, [deepLinkId, rows]);

    const filtered = useMemo(() => {
        return rows.filter((r) => {
            if (tierFilter !== 'all' && r.artisan.tier !== tierFilter) return false;
            if (labelFilter === 'epv' && !r.artisan.epvLabeled) return false;
            if (labelFilter === 'ofg' && !r.artisan.ofgLabeled) return false;
            if (plusFilter === 'on' && !r.artisan.plus) return false;
            if (plusFilter === 'off' && r.artisan.plus) return false;
            if (cohortFilter !== 'all' && r.cohortMonth !== cohortFilter) return false;
            if (healthFilter === 'lt50' && r.health.total >= 50) return false;
            if (healthFilter === 'gte80capacity' && r.health.capacityUtilization < 80) return false;
            if (search.trim().length > 0) {
                const needle = search.toLowerCase();
                const haystack =
                    `${r.artisan.atelierName} ${r.artisan.displayName} ${r.artisan.city} ${r.artisan.id}`.toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    }, [rows, search, tierFilter, labelFilter, plusFilter, cohortFilter, healthFilter]);

    return (
        <TooltipProvider>
            <div className="space-y-5">
                <div>
                    <h2 className="text-foreground text-xl font-semibold">Artisans</h2>
                    <Badge
                        variant="outline"
                        className="border-lumiris-emerald/40 text-lumiris-emerald mt-1.5 font-mono text-[10px]"
                    >
                        Périmètre V1 — textile artisanal français
                    </Badge>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {mockArtisans.length} ateliers - CRM léger sur la base ATELIER : santé compte décomposée,
                        cohortes NRR, suggestion de montée de tier.
                    </p>
                </div>

                <NonNegotiableBanner rule="Score santé compte = vue interne. Jamais visible côté artisan ni côté VISION." />

                <CohortMetricsPanel metrics={cohortMetrics} />

                <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                    <div className="min-w-55 relative flex-1">
                        <Search className="text-muted-foreground/60 absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Atelier, nom, ville…"
                            className="pl-8"
                        />
                    </div>
                    <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as ArtisanTier | 'all')}>
                        <SelectTrigger className="w-35">
                            <Filter className="mr-1 h-3.5 w-3.5" /> <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous tiers</SelectItem>
                            <SelectItem value="Solo">Solo</SelectItem>
                            <SelectItem value="Studio">Studio</SelectItem>
                            <SelectItem value="Maison">Maison</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={labelFilter} onValueChange={(v) => setLabelFilter(v as 'all' | 'epv' | 'ofg')}>
                        <SelectTrigger className="w-35">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous labels</SelectItem>
                            <SelectItem value="epv">EPV</SelectItem>
                            <SelectItem value="ofg">OFG</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={plusFilter} onValueChange={(v) => setPlusFilter(v as 'all' | 'on' | 'off')}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ATELIER+ (tous)</SelectItem>
                            <SelectItem value="on">ATELIER+ uniquement</SelectItem>
                            <SelectItem value="off">Sans ATELIER+</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={cohortFilter} onValueChange={setCohortFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes cohortes</SelectItem>
                            {cohortMonths.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {formatCohortLabel(m)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={healthFilter} onValueChange={(v) => setHealthFilter(v as HealthFilter)}>
                        <SelectTrigger className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Santé : tous</SelectItem>
                            <SelectItem value="lt50">Santé &lt; 50</SelectItem>
                            <SelectItem value="gte80capacity">À 80 % du plafond</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <ArtisanTable rows={filtered} onSelect={setSelected} onResetFilters={resetFilters} />

                <ArtisanDrawer artisan={selected} onClose={() => setSelected(null)} />
            </div>
        </TooltipProvider>
    );
}

function CohortMetricsPanel({ metrics }: { metrics: readonly CohortBucketMetrics[] }) {
    return (
        <div className="border-border bg-card grid grid-cols-2 gap-3 rounded-xl border p-4 sm:grid-cols-3 lg:grid-cols-5">
            {metrics.map((bucket) => (
                <div key={bucket.label} className="space-y-1">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                        NRR {bucket.label} · n={bucket.cohortSize}
                    </p>
                    <p className="text-foreground font-mono text-lg">{bucket.nrr}%</p>
                    <p className="text-muted-foreground text-[11px]">
                        Expansion : <span className="font-mono">{bucket.expansion}</span> · Churn :{' '}
                        <span className="font-mono">{bucket.churn}</span>
                    </p>
                </div>
            ))}
            <div className="space-y-1">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                    Expansion (Solo→Studio 3 mois)
                </p>
                <p className="text-foreground font-mono text-lg">{metrics[0]?.expansion ?? 0}</p>
                <p className="text-muted-foreground text-[11px]">Activations ATELIER+ cohorte M-3.</p>
            </div>
            <div className="space-y-1">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Churn brut (M-12)</p>
                <p className="text-foreground font-mono text-lg">
                    {metrics.find((m) => m.monthsAgo === 12)?.churn ?? 0}
                </p>
                <p className="text-muted-foreground text-[11px]">Souscriptions annulées sur 12 mois glissants.</p>
            </div>
        </div>
    );
}

function ArtisanTable({
    rows,
    onSelect,
    onResetFilters,
}: {
    rows: readonly ArtisanRow[];
    onSelect: (a: Artisan) => void;
    onResetFilters: () => void;
}) {
    if (rows.length === 0) {
        return (
            <EmptyState
                title="Aucun artisan ne correspond"
                description="Réinitialisez les filtres pour retrouver les ateliers à accompagner."
                action={
                    <Button size="sm" variant="outline" onClick={onResetFilters} className="gap-1.5">
                        <Filter className="h-3.5 w-3.5" aria-hidden /> Réinitialiser les filtres
                    </Button>
                }
            />
        );
    }
    return (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader stickyHeader>
                        <TableRow>
                            <TableHead>Atelier</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Labels</TableHead>
                            <TableHead>ATELIER+</TableHead>
                            <TableHead>Passeports</TableHead>
                            <TableHead>Score Iris</TableHead>
                            <TableHead>Santé</TableHead>
                            <TableHead>MRR</TableHead>
                            <TableHead>Cohorte</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <ArtisanTableRow key={row.artisan.id} row={row} onSelect={onSelect} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function ArtisanTableRow({ row, onSelect }: { row: ArtisanRow; onSelect: (a: Artisan) => void }) {
    const ratio =
        row.artisan.passportLimit === Number.POSITIVE_INFINITY
            ? 0
            : Math.min(100, (row.publishedCount / row.artisan.passportLimit) * 100);
    const band = healthBand(row.health.total);

    return (
        <TableRow className="cursor-pointer" onClick={() => onSelect(row.artisan)}>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={row.artisan.photoUrl} alt="" />
                        <AvatarFallback className="text-[10px]">
                            {row.artisan.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-foreground truncate text-sm">{row.artisan.atelierName}</p>
                        <p className="text-muted-foreground truncate text-[11px]">
                            {row.artisan.displayName} · {row.artisan.city}
                        </p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className="font-mono text-[10px]">
                    {row.artisan.tier}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    {row.artisan.epvLabeled ? (
                        <Badge
                            variant="outline"
                            className="border-lumiris-emerald/40 text-lumiris-emerald font-mono text-[10px]"
                        >
                            EPV
                        </Badge>
                    ) : null}
                    {row.artisan.ofgLabeled ? (
                        <Badge
                            variant="outline"
                            className="border-lumiris-amber/40 text-lumiris-amber font-mono text-[10px]"
                        >
                            OFG
                        </Badge>
                    ) : null}
                    {!row.artisan.epvLabeled && !row.artisan.ofgLabeled ? (
                        <span className="text-muted-foreground text-[11px]">-</span>
                    ) : null}
                </div>
            </TableCell>
            <TableCell>
                {row.artisan.plus ? (
                    <Badge variant="outline" className="border-lumiris-cyan/40 text-lumiris-cyan font-mono text-[10px]">
                        ON
                    </Badge>
                ) : (
                    <span className="text-muted-foreground text-[11px]">-</span>
                )}
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs">
                        {row.publishedCount}
                        <span className="text-muted-foreground">
                            {' '}
                            / {row.artisan.passportLimit === Number.POSITIVE_INFINITY ? '∞' : row.artisan.passportLimit}
                        </span>
                    </span>
                    {ratio > 0 ? <Progress value={ratio} className="h-1" /> : null}
                    {row.upgradeHint ? (
                        <Badge
                            variant="outline"
                            className="border-lumiris-cyan/40 text-lumiris-cyan mt-0.5 gap-1 font-mono text-[10px]"
                        >
                            <ArrowUpCircle className="h-3 w-3" /> Upgrade conseillé {row.upgradeHint}
                        </Badge>
                    ) : null}
                </div>
            </TableCell>
            <TableCell>
                <span className="font-mono text-xs">
                    {row.avgScore === 0 ? '-' : row.avgScore.toFixed(1)}
                    {row.avgGrade !== '-' ? <span className="text-muted-foreground"> · {row.avgGrade}</span> : null}
                </span>
            </TableCell>
            <TableCell>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={`border-border bg-background inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] ${
                                band === 'critical'
                                    ? 'border-lumiris-rose/40 text-lumiris-rose'
                                    : band === 'warning'
                                      ? 'border-lumiris-amber/40 text-lumiris-amber'
                                      : 'border-lumiris-emerald/40 text-lumiris-emerald'
                            }`}
                        >
                            {row.health.total}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1 text-left">
                            <p className="font-mono text-[10px] opacity-80">Santé compte · décomposition</p>
                            <p className="text-[11px]">
                                Capacité (40%) · {row.health.capacityScore} pts
                                <span className="opacity-70"> ({row.health.capacityUtilization}% utilisé)</span>
                            </p>
                            <p className="text-[11px]">Iris moyen (35%) · {row.health.irisScore} pts</p>
                            <p className="text-[11px]">
                                Overrides 90j (25%) · {row.health.overrideScore} pts
                                <span className="opacity-70"> ({row.health.overrideCount90d} override·s)</span>
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TableCell>
            <TableCell>
                <span className="font-mono text-xs">{row.mrr}€</span>
            </TableCell>
            <TableCell>
                <span className="font-mono text-[11px]" title={row.cohortMonth}>
                    {formatCohortLabel(row.cohortMonth, row.cohortOffset)}
                </span>
            </TableCell>
            <TableCell className="text-right">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(row.artisan);
                    }}
                >
                    Détail
                </Button>
            </TableCell>
        </TableRow>
    );
}

function ArtisanDrawer({ artisan, onClose }: { artisan: Artisan | null; onClose: () => void }) {
    return (
        <Sheet open={artisan !== null} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="bg-background w-full overflow-hidden p-0 sm:max-w-2xl">
                {artisan ? <ArtisanDrawerBody artisan={artisan} onClose={onClose} /> : null}
            </SheetContent>
        </Sheet>
    );
}

function formatCohortLabel(month: string, offset?: number): string {
    const [y, m] = month.split('-');
    if (!y || !m) return month;
    const monthIdx = Number(m) - 1;
    const date = new Date(Date.UTC(Number(y), monthIdx, 1));
    const label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    if (offset === undefined) return label;
    return offset === 0 ? `M0 · ${label}` : `M${offset} · ${label}`;
}

export const Artisans = memo(ArtisansComponent);
