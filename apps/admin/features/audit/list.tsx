'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, ChevronsUpDown, Download, FileSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import type { AdminAuditLogEntry, AdminUserRole } from '@lumiris/types';
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
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@lumiris/ui/components/command';
import { Input } from '@lumiris/ui/components/input';
import { Popover, PopoverContent, PopoverTrigger } from '@lumiris/ui/components/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@lumiris/ui/components/sheet';
import { cn } from '@lumiris/ui/lib/cn';
import { useAdminAuditLog, useLogAction, usePermission } from '@/lib/auth';
import { detectAnomalies, type AnomalyAlert } from '@/lib/governance-anomalies';
import { EmptyState } from '@/features/_shared/empty-state';
import { PaginationBar } from '@/features/_shared/pagination-bar';
import { usePagination } from '@/features/_shared/use-pagination';
import {
    ACTION_TONE,
    CATEGORY_LABEL,
    ROLE_LABEL,
    ROLE_TONE,
    actionCategory,
    inTimeBucket,
    type Category,
    type TimeBucket,
} from '@/features/_shared/action-status';
import { DetailSheet } from './detail-sheet';

type PeriodFilter = 'all' | 'today' | '7d' | '30d';

const PERIOD_OPTIONS: ReadonlyArray<{ value: PeriodFilter; label: string }> = [
    { value: 'all', label: 'Toute la période' },
    { value: 'today', label: "Aujourd'hui" },
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
];

const CATEGORY_VALUES: readonly Category[] = [
    'passport',
    'artisan',
    'retoucheur',
    'vision_user',
    'billing',
    'affiliation',
    'governance',
];

const TIME_OPTIONS: ReadonlyArray<{ value: TimeBucket; label: string }> = [
    { value: 'all', label: 'Toutes plages' },
    { value: 'business', label: 'Heures ouvrées' },
    { value: 'after_hours', label: 'Nuit (22h–6h)' },
    { value: 'weekend', label: 'Week-end' },
];

const EXPORT_THRESHOLD = 10_000;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDayIso(iso: string): string {
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

function dayLabel(iso: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - DAY_MS);
    const dayStart = new Date(iso);
    if (dayStart.getTime() === today.getTime()) return "Aujourd'hui";
    if (dayStart.getTime() === yesterday.getTime()) return 'Hier';
    return dayStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function inPeriod(iso: string, period: PeriodFilter): boolean {
    if (period === 'all') return true;
    const now = Date.now();
    const t = new Date(iso).getTime();
    if (period === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return t >= start.getTime();
    }
    const days = period === '7d' ? 7 : 30;
    return now - t <= days * DAY_MS;
}

export function AuditList() {
    const auditLog = useAdminAuditLog();
    const log = useLogAction();
    const canExport = usePermission('governance.export_audit_log');
    const searchParams = useSearchParams();
    const focusId = searchParams?.get('focus') ?? null;

    const [search, setSearch] = useState('');
    const [period, setPeriod] = useState<PeriodFilter>('all');
    const [actorFilter, setActorFilter] = useState<string>('all');
    const [actorPickerOpen, setActorPickerOpen] = useState(false);

    const [roleFilter, setRoleFilter] = useState<AdminUserRole | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
    const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
    const [timeFilter, setTimeFilter] = useState<TimeBucket>('all');

    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [exportConfirm, setExportConfirm] = useState(false);
    const [selected, setSelected] = useState<AdminAuditLogEntry | null>(null);

    const entryRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

    const distinctActors = useMemo(() => Array.from(new Set(auditLog.map((e) => e.actorId))).sort(), [auditLog]);
    const targetTypes = useMemo(() => Array.from(new Set(auditLog.map((e) => e.targetType))).sort(), [auditLog]);

    const filtered = useMemo(() => {
        return auditLog.filter((e) => {
            if (!inPeriod(e.ts, period)) return false;
            if (actorFilter !== 'all' && e.actorId !== actorFilter) return false;
            if (roleFilter !== 'all' && e.actorRole !== roleFilter) return false;
            if (categoryFilter !== 'all' && actionCategory(e.action) !== categoryFilter) return false;
            if (targetTypeFilter !== 'all' && e.targetType !== targetTypeFilter) return false;
            if (!inTimeBucket(e.ts, timeFilter)) return false;
            if (search.trim().length > 0) {
                const needle = search.toLowerCase();
                const haystack = `${e.actorId} ${e.targetId} ${e.action} ${e.targetType}`.toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            return true;
        });
    }, [auditLog, period, actorFilter, roleFilter, categoryFilter, targetTypeFilter, timeFilter, search]);

    const pagination = usePagination(filtered, 25);

    useEffect(() => {
        if (!focusId) return;
        const found = auditLog.find((e) => e.id === focusId);
        if (!found) return;
        setSelected(found);
        const target = entryRefs.current.get(focusId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [focusId, auditLog]);

    const hasActiveFilters =
        search.length > 0 ||
        period !== 'all' ||
        actorFilter !== 'all' ||
        roleFilter !== 'all' ||
        categoryFilter !== 'all' ||
        targetTypeFilter !== 'all' ||
        timeFilter !== 'all';

    const resetFilters = () => {
        setSearch('');
        setPeriod('all');
        setActorFilter('all');
        setRoleFilter('all');
        setCategoryFilter('all');
        setTargetTypeFilter('all');
        setTimeFilter('all');
    };

    const runExport = () => {
        const anomalies = detectAnomalies(auditLog);
        const anomalyByEntryId = new Map<string, AnomalyAlert>();
        for (const a of anomalies) for (const id of a.relatedIds) anomalyByEntryId.set(id, a);
        const header = [
            'ts',
            'actorId',
            'actorRole',
            'action',
            'targetType',
            'targetId',
            'payload',
            'anomalyRule',
        ].join(',');
        const rows = filtered.map((e) => {
            const a = anomalyByEntryId.get(e.id);
            return [
                e.ts,
                e.actorId,
                e.actorRole,
                e.action,
                e.targetType,
                e.targetId,
                JSON.stringify(e.payload).replace(/,/g, ';'),
                a?.rule ?? '',
            ].join(',');
        });
        const csv = `${header}\n${rows.join('\n')}`;
        log({
            action: 'governance.export_audit_log',
            targetType: 'period',
            targetId: `filter-${Date.now()}`,
            payload: { count: filtered.length, format: 'csv' },
        });
        if (typeof window !== 'undefined') {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lumiris-audit-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleExportClick = () => {
        if (filtered.length > EXPORT_THRESHOLD) setExportConfirm(true);
        else runExport();
    };

    const grouped = useMemo(() => {
        const map = new Map<string, AdminAuditLogEntry[]>();
        for (const entry of pagination.pageItems) {
            const key = startOfDayIso(entry.ts);
            const list = map.get(key) ?? [];
            list.push(entry);
            map.set(key, list);
        }
        return Array.from(map.entries()).map(([day, items]) => ({ day, items }));
    }, [pagination.pageItems]);

    return (
        <div className="space-y-6">
            <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 -mx-4 space-y-3 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[240px] flex-1">
                        <Search
                            className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                            aria-hidden
                        />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Acteur, action, cible…"
                            aria-label="Rechercher dans le journal d'audit"
                            // eslint-disable-next-line jsx-a11y/no-autofocus -- recherche est l'action principale de la page
                            autoFocus
                            className="pl-9"
                        />
                    </div>

                    <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
                        <SelectTrigger
                            aria-label="Filtrer par période"
                            className={cn('h-9 w-auto gap-1.5', period !== 'all' && 'border-lumiris-cyan/40')}
                        >
                            <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                            {PERIOD_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover open={actorPickerOpen} onOpenChange={setActorPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={actorPickerOpen}
                                aria-label="Filtrer par acteur"
                                className={cn(
                                    'h-9 justify-between gap-1.5',
                                    actorFilter !== 'all' && 'border-lumiris-cyan/40',
                                )}
                            >
                                <span className="truncate">{actorFilter === 'all' ? 'Tous acteurs' : actorFilter}</span>
                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Rechercher un acteur…" />
                                <CommandList>
                                    <CommandEmpty>Aucun acteur.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="all"
                                            onSelect={() => {
                                                setActorFilter('all');
                                                setActorPickerOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-3.5 w-3.5',
                                                    actorFilter === 'all' ? 'opacity-100' : 'opacity-0',
                                                )}
                                                aria-hidden
                                            />
                                            Tous acteurs
                                        </CommandItem>
                                        {distinctActors.map((id) => (
                                            <CommandItem
                                                key={id}
                                                value={id}
                                                onSelect={() => {
                                                    setActorFilter(id);
                                                    setActorPickerOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-3.5 w-3.5',
                                                        actorFilter === id ? 'opacity-100' : 'opacity-0',
                                                    )}
                                                    aria-hidden
                                                />
                                                <span className="font-mono text-xs">{id}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <Sheet open={advancedOpen} onOpenChange={setAdvancedOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'h-9 gap-1.5',
                                    (roleFilter !== 'all' ||
                                        categoryFilter !== 'all' ||
                                        targetTypeFilter !== 'all' ||
                                        timeFilter !== 'all') &&
                                        'border-lumiris-cyan/40',
                                )}
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Filtres avancés
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[360px] sm:w-[420px]">
                            <SheetHeader>
                                <SheetTitle>Filtres avancés</SheetTitle>
                                <SheetDescription>
                                    Restreindre la recherche par rôle, catégorie ou cible.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="space-y-4 px-4 py-2">
                                <FilterField label="Rôle">
                                    <Select
                                        value={roleFilter}
                                        onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous rôles" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous rôles</SelectItem>
                                            {(Object.keys(ROLE_LABEL) as AdminUserRole[]).map((r) => (
                                                <SelectItem key={r} value={r}>
                                                    {ROLE_LABEL[r]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FilterField>
                                <FilterField label="Catégorie">
                                    <Select
                                        value={categoryFilter}
                                        onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Toutes catégories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toutes catégories</SelectItem>
                                            {CATEGORY_VALUES.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {CATEGORY_LABEL[c]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FilterField>
                                <FilterField label="Type de cible">
                                    <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Toutes cibles" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toutes cibles</SelectItem>
                                            {targetTypes.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FilterField>
                                <FilterField label="Plage horaire">
                                    <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeBucket)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Toutes plages" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FilterField>
                            </div>
                            <SheetFooter>
                                <SheetClose asChild>
                                    <Button variant="outline">Appliquer</Button>
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>

                    {hasActiveFilters ? (
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 gap-1.5">
                            <X className="h-3.5 w-3.5" aria-hidden /> Réinitialiser
                        </Button>
                    ) : null}

                    <div className="ml-auto">
                        <Button
                            variant="outline"
                            onClick={handleExportClick}
                            disabled={!canExport || filtered.length === 0}
                            aria-label="Exporter le journal d'audit au format CSV"
                            className="h-9 gap-1.5"
                        >
                            <Download className="h-3.5 w-3.5" aria-hidden /> Export CSV
                        </Button>
                    </div>
                </div>

                <p className="text-muted-foreground text-xs" aria-live="polite">
                    {filtered.length === 0
                        ? `0 entrée${auditLog.length > 0 ? ` sur ${auditLog.length}` : ''}`
                        : `${filtered.length.toLocaleString('fr-FR')} entrée${filtered.length > 1 ? 's' : ''}`}
                </p>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={FileSearch}
                    title={auditLog.length === 0 ? 'Aucune action enregistrée.' : 'Aucune entrée ne correspond.'}
                    description={
                        auditLog.length === 0 ? "Le journal d'audit se remplira au fil des actions admin." : undefined
                    }
                    action={
                        hasActiveFilters ? (
                            <Button size="sm" variant="outline" onClick={resetFilters}>
                                Réinitialiser les filtres
                            </Button>
                        ) : null
                    }
                />
            ) : (
                <div className="border-border bg-card divide-border divide-y rounded-xl border">
                    {grouped.map(({ day, items }) => (
                        <Fragment key={day}>
                            <div className="bg-muted/30 border-border border-b px-4 py-2">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider">
                                    {dayLabel(day)}
                                </span>
                            </div>
                            {items.map((entry) => (
                                <button
                                    key={entry.id}
                                    ref={(node) => {
                                        if (node) entryRefs.current.set(entry.id, node);
                                        else entryRefs.current.delete(entry.id);
                                    }}
                                    type="button"
                                    onClick={() => setSelected(entry)}
                                    aria-label={`Action ${entry.action} par ${entry.actorId} sur ${entry.targetType}/${entry.targetId}`}
                                    className={cn(
                                        'hover:bg-muted/30 flex w-full items-center gap-3 px-4 py-2 text-left text-sm',
                                        focusId === entry.id
                                            ? 'bg-lumiris-cyan/10 ring-lumiris-cyan/40 ring-1 ring-inset'
                                            : '',
                                    )}
                                >
                                    <span className="text-muted-foreground w-12 shrink-0 font-mono text-xs">
                                        {new Date(entry.ts).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={cn('shrink-0 text-[10px]', ROLE_TONE[entry.actorRole])}
                                    >
                                        {ROLE_LABEL[entry.actorRole]}
                                    </Badge>
                                    <span className="text-foreground w-24 shrink-0 truncate font-mono text-xs">
                                        {entry.actorId}
                                    </span>
                                    <span className={cn('shrink-0 font-mono text-xs', ACTION_TONE[entry.action])}>
                                        {entry.action}
                                    </span>
                                    <span className="text-muted-foreground/70 shrink-0">→</span>
                                    <span className="text-muted-foreground truncate font-mono text-xs">
                                        {entry.targetType}/{entry.targetId}
                                    </span>
                                </button>
                            ))}
                        </Fragment>
                    ))}
                    <PaginationBar
                        page={pagination.page}
                        pageCount={pagination.pageCount}
                        pageSize={pagination.pageSize}
                        rangeStart={pagination.rangeStart}
                        rangeEnd={pagination.rangeEnd}
                        totalCount={filtered.length}
                        onPageChange={pagination.setPage}
                        label="entrées"
                    />
                </div>
            )}

            <DetailSheet entry={selected} onClose={() => setSelected(null)} />

            <AlertDialog open={exportConfirm} onOpenChange={setExportConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Export volumineux</AlertDialogTitle>
                        <AlertDialogDescription>
                            {filtered.length.toLocaleString('fr-FR')} entrées dépassent le seuil recommandé de{' '}
                            {EXPORT_THRESHOLD.toLocaleString('fr-FR')}. Affiner les filtres avant l&apos;export, ou
                            confirmer pour générer le CSV complet.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setExportConfirm(false);
                                runExport();
                            }}
                        >
                            Exporter quand même
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">{label}</span>
            {children}
        </label>
    );
}
