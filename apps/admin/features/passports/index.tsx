'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowDownUp,
    CheckCircle2,
    Filter,
    Flag,
    Info,
    MessageSquare,
    Search,
    Sparkles,
    TriangleAlert,
    Users,
} from 'lucide-react';
import { mockArtisans, mockPassports } from '@lumiris/mock-data';
import type { Passport, ArtisanTier, IrisGrade as IrisGradeLetter } from '@lumiris/types';
import { IrisGrade as IrisGradeBadge } from '@lumiris/scoring-ui';
import { Avatar, AvatarFallback, AvatarImage } from '@lumiris/ui/components/avatar';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { Checkbox } from '@lumiris/ui/components/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lumiris/ui/components/collapsible';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@lumiris/ui/components/hover-card';
import { Input } from '@lumiris/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumiris/ui/components/table';
import { Textarea } from '@lumiris/ui/components/textarea';
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
import { useToast } from '@lumiris/ui/hooks/use-toast';
import { cn } from '@lumiris/ui/lib/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lumiris/ui/components/tooltip';
import { useLogAction, usePermission } from '@/lib/auth';
import { CurationStoreProvider, useCurationStore } from './curation-store';
import { PassportDrawer } from './drawer';
import { useIrisScore, usePassportRows } from './hooks';
import type { EffectiveStatus, PassportRow } from './types';
import { EmptyState } from '../_shared/empty-state';
import { GovernanceBanner } from '../_shared/governance-banner';
import { NonNegotiableBanner } from '../_shared/non-negotiable-banner';
import { PaginationBar } from '../_shared/pagination-bar';
import { usePagination } from '../_shared/use-pagination';

const STATUS_LABEL: Record<EffectiveStatus, string> = {
    pending: 'À examiner',
    validated: 'Validé',
    changes_requested: 'Changements demandés',
    flagged: 'Flaggé',
    archived: 'Archivé',
};

const STATUS_TONE: Record<EffectiveStatus, string> = {
    pending: 'border-lumiris-cyan/40 bg-lumiris-cyan/10 text-lumiris-cyan',
    validated: 'border-lumiris-emerald/40 bg-lumiris-emerald/10 text-lumiris-emerald',
    changes_requested: 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber',
    flagged: 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose',
    archived: 'border-muted-foreground/40 bg-muted text-muted-foreground',
};

const SLA_AMBER_HOURS = 48;
const SLA_ROSE_HOURS = 96;

type SortKey = 'fifo' | 'grade' | 'artisan';
type RegulatoryFilter = 'all' | 'capped' | 'missing-fields';
type PlusFilter = 'all' | 'plus-only';

function PassportsComponent() {
    return (
        <CurationStoreProvider>
            <PassportsInner />
        </CurationStoreProvider>
    );
}

function PassportsInner() {
    const rows = usePassportRows(mockPassports);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<EffectiveStatus | 'all'>('all');
    const [tierFilter, setTierFilter] = useState<ArtisanTier | 'all'>('all');
    const [labelFilter, setLabelFilter] = useState<'all' | 'epv' | 'ofg'>('all');
    const [regulatoryFilter, setRegulatoryFilter] = useState<RegulatoryFilter>('all');
    const [plusFilter, setPlusFilter] = useState<PlusFilter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('fifo');
    const [selected, setSelected] = useState<Passport | null>(null);
    const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

    // Deep-link `?id=PASS-xxx` — `window.location` évite useSearchParams qui forcerait Suspense au niveau de la route.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (!id) return;
        const found = mockPassports.find((p) => p.id === id);
        if (found) setSelected(found);
    }, []);

    const filtered = useMemo(() => {
        return rows.filter((row) => {
            if (statusFilter !== 'all' && row.status !== statusFilter) return false;
            const artisan = mockArtisans.find((a) => a.id === row.passport.artisanId);
            if (tierFilter !== 'all' && artisan?.tier !== tierFilter) return false;
            if (labelFilter === 'epv' && !artisan?.epvLabeled) return false;
            if (labelFilter === 'ofg' && !artisan?.ofgLabeled) return false;
            if (regulatoryFilter === 'capped' && !row.capApplied) return false;
            if (regulatoryFilter === 'missing-fields' && !row.hasMissingRegulatoryField) return false;
            if (plusFilter === 'plus-only' && !row.isAtelierPlus) return false;
            if (search.trim().length > 0) {
                const needle = search.toLowerCase();
                const haystack = [
                    row.passport.id,
                    row.passport.garment.reference,
                    artisan?.atelierName ?? '',
                    artisan?.displayName ?? '',
                    artisan?.city ?? '',
                ]
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    }, [rows, search, statusFilter, tierFilter, labelFilter, regulatoryFilter, plusFilter]);

    const kpis = useMemo(() => {
        const pending = rows.filter((r) => r.status === 'pending').length;
        const flagged = rows.filter((r) => r.status === 'flagged').length;
        const validatedLast7d = rows.filter(
            (r) => r.status === 'validated' && Date.now() - new Date(r.passport.updatedAt).getTime() < 7 * 86_400_000,
        ).length;
        const pendingRows = rows.filter((r) => r.status === 'pending');
        const avgDelayHours =
            pendingRows.length === 0
                ? 0
                : Math.round(pendingRows.reduce((sum, r) => sum + r.ageHours, 0) / pendingRows.length);
        const overSlaHours = pendingRows.filter((r) => r.ageHours >= SLA_AMBER_HOURS).length;
        return { pending, flagged, validatedLast7d, avgDelayHours, overSlaHours };
    }, [rows]);

    return (
        <div className="space-y-5">
            <div className="flex items-baseline justify-between gap-3">
                <div>
                    <h2 className="text-foreground text-xl font-semibold">File de curation</h2>
                    <Badge
                        variant="outline"
                        className="border-lumiris-emerald/40 text-lumiris-emerald mt-1.5 font-mono text-[10px]"
                    >
                        Périmètre V1 — textile artisanal français
                    </Badge>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {mockPassports.length} passeports - calculé en direct via{' '}
                        <span className="font-mono">computeScore()</span>.
                    </p>
                </div>
            </div>

            <NonNegotiableBanner rule="ATELIER+ ne modifie jamais l'ordre de la file. Tri FIFO strict. Personne ne paie pour son score Iris." />

            <Kpis {...kpis} />

            <GovernanceBanner />
            <FairnessBanner />

            <FifoEquityAudit rows={rows} />

            <div className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3">
                <div className="min-w-55 relative flex-1">
                    <Search className="text-muted-foreground/60 absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Référence, artisan, ville…"
                        className="pl-8"
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EffectiveStatus | 'all')}>
                    <SelectTrigger className="w-45">
                        <Filter className="mr-1 h-3.5 w-3.5" /> <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        <SelectItem value="pending">À examiner</SelectItem>
                        <SelectItem value="validated">Validé</SelectItem>
                        <SelectItem value="changes_requested">Changements demandés</SelectItem>
                        <SelectItem value="flagged">Flaggé</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as ArtisanTier | 'all')}>
                    <SelectTrigger className="w-35">
                        <SelectValue placeholder="Tier" />
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
                        <SelectValue placeholder="Label" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous labels</SelectItem>
                        <SelectItem value="epv">EPV</SelectItem>
                        <SelectItem value="ofg">OFG</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={regulatoryFilter} onValueChange={(v) => setRegulatoryFilter(v as RegulatoryFilter)}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Conformité" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes conformités</SelectItem>
                        <SelectItem value="capped">Plafonné D</SelectItem>
                        <SelectItem value="missing-fields">Champ ESPR/AGEC manquant</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={plusFilter} onValueChange={(v) => setPlusFilter(v as PlusFilter)}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="ATELIER+" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Solo + ATELIER+</SelectItem>
                        <SelectItem value="plus-only">ATELIER+ uniquement (audit)</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <SelectTrigger className="w-40">
                        <ArrowDownUp className="mr-1 h-3.5 w-3.5" /> <SelectValue placeholder="Tri" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fifo">FIFO (équitable)</SelectItem>
                        <SelectItem value="grade">Par grade</SelectItem>
                        <SelectItem value="artisan">Par artisan</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <BulkActionsBar rows={filtered} selectedIds={selectedIds} onClear={() => setSelectedIds(new Set())} />

            <PassportTable
                rows={filtered}
                sortKey={sortKey}
                onSelect={setSelected}
                selectedIds={selectedIds}
                onToggleSelected={(id) =>
                    setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                    })
                }
                onToggleAll={(ids, value) =>
                    setSelectedIds((prev) => {
                        const next = new Set(prev);
                        for (const id of ids) {
                            if (value) next.add(id);
                            else next.delete(id);
                        }
                        return next;
                    })
                }
            />

            <PassportDrawer passport={selected} onClose={() => setSelected(null)} />
        </div>
    );
}

function FairnessBanner() {
    return (
        <HoverCard openDelay={120}>
            <HoverCardTrigger asChild>
                <button
                    type="button"
                    className="border-lumiris-emerald/30 bg-lumiris-emerald/5 text-lumiris-emerald hover:bg-lumiris-emerald/10 flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors"
                >
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>
                        <strong>Tri équitable</strong> - ATELIER+ n&apos;influence pas l&apos;ordre. Le tri par défaut
                        est FIFO sur date de soumission. Cliquez pour voir la règle.
                    </span>
                </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
                <div className="space-y-2 text-xs">
                    <p className="text-foreground font-semibold">Personne n&apos;achète sa place dans la file.</p>
                    <p className="text-muted-foreground">
                        ATELIER+ donne accès au dépôt-vente, à la facturation OCR et à l&apos;analytics - jamais à un
                        coupe-file ni à un boost de score. La file de curation est strictement FIFO sur la date de
                        soumission. Une route indique le flag <code className="bg-muted rounded px-1">addonPlus</code>{' '}
                        sur les profils, mais le scoring l&apos;ignore.
                    </p>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

interface FifoEntry {
    row: PassportRow;
    enqueuedRank: number;
    publishedRank: number;
}

function FifoEquityAudit({ rows }: { rows: readonly PassportRow[] }) {
    const audit = useMemo(() => {
        const enqueuedOrder = [...rows].sort(
            (a, b) => new Date(a.passport.createdAt).getTime() - new Date(b.passport.createdAt).getTime(),
        );
        const enqueuedRankById = new Map<string, number>();
        enqueuedOrder.forEach((r, i) => enqueuedRankById.set(r.passport.id, i + 1));

        const validated = rows.filter((r) => r.status === 'validated');
        const sortedValidated = [...validated].sort((a, b) => publishedTime(a) - publishedTime(b));
        const last10 = sortedValidated.slice(-10).reverse();
        const entries: FifoEntry[] = last10.map((row, i) => ({
            row,
            enqueuedRank: enqueuedRankById.get(row.passport.id) ?? 0,
            publishedRank: sortedValidated.length - i,
        }));

        const orderViolations = entries.filter((e) => {
            if (!e.row.isAtelierPlus) return false;
            const enqueuedThis = e.enqueuedRank;
            const publishedThisTime = publishedTime(e.row);
            return entries.some((other) => {
                if (other.row.passport.id === e.row.passport.id) return false;
                if (other.row.isAtelierPlus) return false;
                return other.enqueuedRank < enqueuedThis && publishedTime(other.row) > publishedThisTime;
            });
        });

        return { entries, orderViolations };
    }, [rows]);

    return (
        <Collapsible className="border-border bg-card rounded-xl border">
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="hover:bg-muted/30 flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-xs transition-colors"
                >
                    <span className="text-foreground inline-flex items-center gap-2 font-medium">
                        <TriangleAlert
                            className={cn(
                                'h-3.5 w-3.5',
                                audit.orderViolations.length > 0 ? 'text-lumiris-rose' : 'text-lumiris-emerald',
                            )}
                        />
                        Équité FIFO - 10 dernières validations
                    </span>
                    <span className="text-muted-foreground font-mono text-[10px]">
                        {audit.orderViolations.length === 0
                            ? 'aucune anomalie détectée'
                            : `${audit.orderViolations.length} doublage(s) suspect(s)`}
                    </span>
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="border-border border-t px-4 py-3">
                    {audit.entries.length === 0 ? (
                        <p className="text-muted-foreground text-xs">Pas encore de validations enregistrées.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Passeport</TableHead>
                                    <TableHead>Tier</TableHead>
                                    <TableHead className="text-right">Rang FIFO</TableHead>
                                    <TableHead className="text-right">Rang sortie</TableHead>
                                    <TableHead className="text-right">Delta</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {audit.entries.map((e) => {
                                    const violated = audit.orderViolations.includes(e);
                                    const delta = e.enqueuedRank - e.publishedRank;
                                    return (
                                        <TableRow
                                            key={e.row.passport.id}
                                            className={cn(violated && 'bg-lumiris-rose/5')}
                                        >
                                            <TableCell className="font-mono text-[10px]">{e.publishedRank}</TableCell>
                                            <TableCell className="font-mono text-[11px]">
                                                {e.row.passport.garment.reference}
                                            </TableCell>
                                            <TableCell>
                                                <ArtisanBadgeForRow row={e.row} />
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-[11px]">
                                                {e.enqueuedRank}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-[11px]">
                                                {e.publishedRank}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-[11px]">
                                                {violated ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-lumiris-rose/40 text-lumiris-rose"
                                                    >
                                                        {delta > 0 ? `+${delta}` : delta} ⚠
                                                    </Badge>
                                                ) : delta > 0 ? (
                                                    `+${delta}`
                                                ) : (
                                                    delta
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                    {audit.orderViolations.length > 0 ? (
                        <p className="text-lumiris-rose mt-3 text-[11px]">
                            ⚠ Un passeport ATELIER+ est passé devant un Solo plus ancien. À auditer manuellement -
                            personne n&apos;achète son rang dans la file.
                        </p>
                    ) : null}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

function ArtisanBadgeForRow({ row }: { row: PassportRow }) {
    const artisan = mockArtisans.find((a) => a.id === row.passport.artisanId);
    return (
        <div className="flex items-center gap-1">
            <Badge variant="outline" className="font-mono text-[10px]">
                {artisan?.tier ?? '-'}
            </Badge>
            {row.isAtelierPlus ? (
                <Badge variant="outline" className="border-lumiris-cyan/40 text-lumiris-cyan font-mono text-[10px]">
                    ATELIER+
                </Badge>
            ) : null}
        </div>
    );
}

function publishedTime(row: PassportRow): number {
    return new Date(
        row.passport.publishedAt ?? row.passport.moderation?.reviewedAt ?? row.passport.updatedAt,
    ).getTime();
}

function Kpis({
    pending,
    flagged,
    validatedLast7d,
    avgDelayHours,
    overSlaHours,
}: {
    pending: number;
    flagged: number;
    validatedLast7d: number;
    avgDelayHours: number;
    overSlaHours: number;
}) {
    const kpis = [
        { label: 'À examiner', value: pending.toString(), tone: 'text-lumiris-cyan' },
        { label: 'Délai moyen', value: `${avgDelayHours} h`, tone: 'text-lumiris-amber' },
        {
            label: 'SLA > 48 h',
            value: overSlaHours.toString(),
            tone: overSlaHours > 0 ? 'text-lumiris-rose' : 'text-lumiris-emerald',
        },
        { label: 'Validés 7j', value: validatedLast7d.toString(), tone: 'text-lumiris-emerald' },
        { label: 'Flags actifs', value: flagged.toString(), tone: 'text-lumiris-rose' },
    ];
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3 lg:grid-cols-5"
        >
            {kpis.map((kpi) => (
                <div key={kpi.label} className="border-border bg-card flex flex-col rounded-xl border p-4">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{kpi.label}</p>
                    <p className={cn('mt-1 font-mono text-2xl font-bold', kpi.tone)}>{kpi.value}</p>
                </div>
            ))}
        </motion.div>
    );
}

function BulkActionsBar({
    rows,
    selectedIds,
    onClear,
}: {
    rows: readonly PassportRow[];
    selectedIds: ReadonlySet<string>;
    onClear: () => void;
}) {
    const canCurate = usePermission('passport.curate');
    const canRequest = usePermission('passport.request_changes');
    const [bulkValidateOpen, setBulkValidateOpen] = useState(false);
    const [bulkRequestOpen, setBulkRequestOpen] = useState(false);

    const selectedRows = useMemo(() => rows.filter((r) => selectedIds.has(r.passport.id)), [rows, selectedIds]);

    const eligibleForBulkValidate = useMemo(
        () =>
            selectedRows.filter(
                (r) => (r.passport.moderation?.status ?? 'PendingReview') === 'PendingReview' && isGradeAtLeastB(r),
            ),
        [selectedRows],
    );

    if (selectedIds.size === 0) return null;

    return (
        <TooltipProvider>
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-lumiris-cyan/30 bg-lumiris-cyan/5 flex flex-wrap items-center gap-2 rounded-xl border p-3"
            >
                <span id="bulk-validate-hint" className="text-foreground text-xs font-medium">
                    {selectedIds.size} passeport(s) sélectionné(s)
                </span>
                <span className="text-muted-foreground text-[10px]">
                    · {eligibleForBulkValidate.length} éligible(s) à la validation (grade ≥ B, en attente)
                </span>
                <div className="ml-auto flex flex-wrap gap-2">
                    {canCurate ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    className="bg-lumiris-emerald hover:bg-lumiris-emerald/90 text-primary-foreground gap-1.5"
                                    disabled={eligibleForBulkValidate.length === 0}
                                    onClick={() => setBulkValidateOpen(true)}
                                    aria-describedby="bulk-validate-hint"
                                    aria-label={`Valider en masse ${eligibleForBulkValidate.length} passeports éligibles`}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                    Valider en masse ({eligibleForBulkValidate.length})
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                Seuls les passeports avec un grade Iris ≥ B et un statut PendingReview sont publiés.
                            </TooltipContent>
                        </Tooltip>
                    ) : null}
                    {canRequest ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => setBulkRequestOpen(true)}
                            aria-label="Demander un complément aux artisans sélectionnés"
                        >
                            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                            Demander complément
                        </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={onClear} aria-label="Annuler la sélection">
                        Vider la sélection
                    </Button>
                </div>

                {canCurate ? (
                    <BulkValidateDialog
                        rows={eligibleForBulkValidate}
                        open={bulkValidateOpen}
                        onOpenChange={setBulkValidateOpen}
                        onDone={onClear}
                    />
                ) : null}
                {canRequest ? (
                    <BulkRequestChangesDialog
                        rows={selectedRows}
                        open={bulkRequestOpen}
                        onOpenChange={setBulkRequestOpen}
                        onDone={onClear}
                    />
                ) : null}
            </motion.div>
        </TooltipProvider>
    );
}

function isGradeAtLeastB(row: PassportRow): boolean {
    // Approximation : un passeport plafonné ou avec champs ESPR/AGEC manquants ne peut pas être ≥ B (grade réel recalculé dans le drawer).
    return !row.capApplied && !row.hasMissingRegulatoryField;
}

function BulkValidateDialog({
    rows,
    open,
    onOpenChange,
    onDone,
}: {
    rows: readonly PassportRow[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDone: () => void;
}) {
    const log = useLogAction();
    const { setOverlay } = useCurationStore();
    const { toast } = useToast();

    const handleConfirm = () => {
        const publishedAt = new Date().toISOString();
        for (const row of rows) {
            setOverlay(row.passport.id, { status: 'validated', publishedAt });
            log({
                action: 'passport.curate',
                targetType: 'passport',
                targetId: row.passport.id,
                payload: {
                    decision: 'validated',
                    bulk: true,
                    publishedAt,
                    qrCodeUrl: row.passport.gs1.verificationUrl,
                    artisanId: row.passport.artisanId,
                },
            });
        }
        toast({
            title: `${rows.length} passeport(s) validé(s)`,
            description: 'Une entrée audit log par passeport a été écrite.',
        });
        onOpenChange(false);
        onDone();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Valider {rows.length} passeport(s) en masse ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Seuls les passeports avec un grade Iris ≥ B et un statut de modération{' '}
                        <code className="bg-muted rounded px-1">PendingReview</code> seront validés. Un événement
                        d&apos;audit individuel sera émis pour chaque passeport.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <ul className="border-border bg-muted/30 max-h-48 space-y-1 overflow-y-auto rounded-xl border p-3 text-xs">
                    {rows.map((r) => (
                        <li key={r.passport.id} className="font-mono text-[11px]">
                            · {r.passport.garment.reference}
                        </li>
                    ))}
                </ul>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className="bg-lumiris-emerald hover:bg-lumiris-emerald/90"
                    >
                        Confirmer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const REQUEST_TEMPLATE = `Bonjour,

Pour finaliser la curation de ce passeport, merci de joindre :
- la facture du fournisseur de fibre principale,
- une photo additionnelle de l'étape de fabrication,
- la fiche entretien complète (lavage / séchage / repassage / stockage).

Sans ces compléments sous 7 jours, le passeport sera renvoyé en brouillon.

Bien à vous,
L'équipe LUMIRIS`;

function BulkRequestChangesDialog({
    rows,
    open,
    onOpenChange,
    onDone,
}: {
    rows: readonly PassportRow[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDone: () => void;
}) {
    const log = useLogAction();
    const { setOverlay } = useCurationStore();
    const { toast } = useToast();
    const [message, setMessage] = useState(REQUEST_TEMPLATE);

    const handleSend = () => {
        if (message.trim().length === 0) return;
        for (const row of rows) {
            setOverlay(row.passport.id, { status: 'changes_requested', changesMessage: message });
            log({
                action: 'passport.request_changes',
                targetType: 'passport',
                targetId: row.passport.id,
                payload: { message, bulk: true, artisanId: row.passport.artisanId },
            });
        }
        toast({
            title: `${rows.length} demande(s) envoyée(s)`,
            description: 'Une entrée audit log par passeport.',
        });
        onOpenChange(false);
        onDone();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Demander un complément à {rows.length} artisan(s)</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le message ci-dessous sera envoyé à chaque artisan concerné. Un événement audit log est tracé
                        par passeport.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-40 font-mono text-xs"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSend} disabled={message.trim().length === 0}>
                        Envoyer ({rows.length})
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function PassportTable({
    rows,
    sortKey,
    onSelect,
    selectedIds,
    onToggleSelected,
    onToggleAll,
}: {
    rows: readonly PassportRow[];
    sortKey: SortKey;
    onSelect: (p: Passport) => void;
    selectedIds: ReadonlySet<string>;
    onToggleSelected: (id: string) => void;
    onToggleAll: (ids: readonly string[], value: boolean) => void;
}) {
    const sorted = useMemo(() => {
        const copy = [...rows];
        if (sortKey === 'fifo') {
            copy.sort((a, b) => new Date(a.passport.createdAt).getTime() - new Date(b.passport.createdAt).getTime());
        } else if (sortKey === 'artisan') {
            copy.sort((a, b) => a.passport.artisanId.localeCompare(b.passport.artisanId));
        }
        return copy;
    }, [rows, sortKey]);

    const pagination = usePagination(sorted, 50);

    if (sorted.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="Aucun passeport en file"
                description="Pas de soumission active. Relancez les artisans inactifs pour amorcer un nouveau cycle de publication."
                action={
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link href="/artisans?filter=inactifs">
                            <Users className="h-3.5 w-3.5" aria-hidden /> Relancer les artisans inactifs
                        </Link>
                    </Button>
                }
            />
        );
    }

    const pageIds = pagination.pageItems.map((r) => r.passport.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const someSelected = !allSelected && pageIds.some((id) => selectedIds.has(id));

    return (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
            <Table>
                <TableHeader stickyHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                onCheckedChange={(v) => onToggleAll(pageIds, v === true)}
                                aria-label="Tout sélectionner"
                            />
                        </TableHead>
                        <TableHead>Passeport</TableHead>
                        <TableHead>Artisan</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Âge file</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pagination.pageItems.map((row) => (
                        <PassportRowItem
                            key={row.passport.id}
                            row={row}
                            sortKey={sortKey}
                            onSelect={onSelect}
                            checked={selectedIds.has(row.passport.id)}
                            onCheckedChange={() => onToggleSelected(row.passport.id)}
                        />
                    ))}
                </TableBody>
            </Table>
            <PaginationBar
                page={pagination.page}
                pageCount={pagination.pageCount}
                pageSize={pagination.pageSize}
                rangeStart={pagination.rangeStart}
                rangeEnd={pagination.rangeEnd}
                totalCount={sorted.length}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                pageSizeOptions={[25, 50, 100]}
                label="passeports"
            />
        </div>
    );
}

function PassportRowItem({
    row,
    sortKey: _sortKey,
    onSelect,
    checked,
    onCheckedChange,
}: {
    row: PassportRow;
    sortKey: SortKey;
    onSelect: (p: Passport) => void;
    checked: boolean;
    onCheckedChange: () => void;
}) {
    const score = useIrisScore(row.passport);
    const artisan = mockArtisans.find((a) => a.id === row.passport.artisanId);
    const grade: IrisGradeLetter = score.grade;

    const slaTone =
        row.ageHours >= SLA_ROSE_HOURS
            ? 'border-lumiris-rose/40 bg-lumiris-rose/10 text-lumiris-rose'
            : row.ageHours >= SLA_AMBER_HOURS
              ? 'border-lumiris-amber/40 bg-lumiris-amber/10 text-lumiris-amber'
              : 'border-border text-muted-foreground';

    return (
        <TableRow className="cursor-pointer transition-colors" onClick={() => onSelect(row.passport)}>
            <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={checked}
                    onCheckedChange={() => onCheckedChange()}
                    aria-label={`Sélectionner ${row.passport.garment.reference}`}
                />
            </TableCell>
            <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                    <div className="bg-muted relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md">
                        {row.passport.garment.mainPhotoUrl ? (
                            <Image
                                src={row.passport.garment.mainPhotoUrl}
                                alt=""
                                fill
                                unoptimized
                                sizes="36px"
                                className="object-cover"
                            />
                        ) : (
                            <Sparkles className="text-muted-foreground/40 h-3 w-3" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-foreground truncate text-sm">{row.passport.garment.reference}</p>
                        <p className="text-muted-foreground truncate text-[10px]">
                            {row.passport.garment.kind} · {row.passport.id}
                        </p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        {artisan?.photoUrl ? <AvatarImage src={artisan.photoUrl} alt="" /> : null}
                        <AvatarFallback className="text-[10px]">
                            {artisan?.displayName.slice(0, 2).toUpperCase() ?? '-'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-foreground text-xs">{artisan?.atelierName ?? '-'}</p>
                        <div className="mt-0.5 flex items-center gap-1">
                            <Badge variant="outline" className="font-mono text-[10px]">
                                {artisan?.tier}
                            </Badge>
                            {artisan?.plus ? (
                                <Badge
                                    variant="outline"
                                    className="border-lumiris-cyan/40 text-lumiris-cyan font-mono text-[10px]"
                                >
                                    ATELIER+
                                </Badge>
                            ) : null}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <IrisGradeBadge grade={grade} size="sm" />
                    {score.cap?.applied ? <Flag className="text-lumiris-rose h-3 w-3" /> : null}
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className={cn('font-mono text-[10px]', STATUS_TONE[row.status])}>
                    {STATUS_LABEL[row.status]}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <Badge variant="outline" className={cn('font-mono text-[10px]', slaTone)}>
                    {row.ageHours} h
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(row.passport);
                    }}
                >
                    Examiner
                </Button>
            </TableCell>
        </TableRow>
    );
}

export const Passports = memo(PassportsComponent);
