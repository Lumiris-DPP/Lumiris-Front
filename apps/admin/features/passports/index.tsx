'use client';

import { Suspense, memo, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { mockArtisans, mockPassports } from '@lumiris/mock-data';
import type { IrisGrade as IrisGradeLetter, Passport } from '@lumiris/types';
import { Button } from '@lumiris/ui/components/button';
import { DataTableFilters } from '@lumiris/ui/components/data-table-filters';
import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Label } from '@lumiris/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumiris/ui/components/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@lumiris/ui/components/sheet';
import { TooltipProvider } from '@lumiris/ui/components/tooltip';
import { BulkActionsBar } from './bulk-actions-bar';
import { CurationStoreProvider } from './curation-store';
import { useDeepLinkId } from '../_shared/use-deep-link-id';
import { FifoViolationsAlert, useFifoAudit } from './fifo-equity-audit';
import { usePassportRows } from './hooks';
import { Kpis } from './kpis';
import { PassportDrawer } from './passport-drawer';
import { PassportTable } from './passport-table';
import { STATUS_FILTER_OPTIONS, type StatusFilterValue, matchesStatusFilter } from './status';
import type { PassportRow } from './types';

type TierFilter = 'all' | 'atelier-plus' | 'standard';
type GradeFilter = 'all' | IrisGradeLetter;
type PeriodFilter = 'all' | '7' | '30' | '90';

const TIER_OPTIONS = [
    { label: 'Tous tiers', value: 'all' },
    { label: 'ATELIER+', value: 'atelier-plus' },
    { label: 'Standard', value: 'standard' },
];

const GRADE_OPTIONS = [
    { label: 'Tous grades', value: 'all' },
    { label: 'Grade A', value: 'A' },
    { label: 'Grade B', value: 'B' },
    { label: 'Grade C', value: 'C' },
    { label: 'Grade D', value: 'D' },
    { label: 'Grade E', value: 'E' },
];

const PERIOD_OPTIONS = [
    { label: 'Toute la file', value: 'all' },
    { label: '7 derniers jours', value: '7' },
    { label: '30 derniers jours', value: '30' },
    { label: '90 derniers jours', value: '90' },
];

interface Filters {
    search: string;
    status: StatusFilterValue;
    tier: TierFilter;
    grade: GradeFilter;
    period: PeriodFilter;
}

function applyFilters(rows: readonly PassportRow[], f: Filters): readonly PassportRow[] {
    const periodHours = f.period === 'all' ? null : Number(f.period) * 24;
    return rows.filter((row) => {
        if (!matchesStatusFilter(row.status, f.status)) return false;
        if (f.tier === 'atelier-plus' && !row.isAtelierPlus) return false;
        if (f.tier === 'standard' && row.isAtelierPlus) return false;
        if (f.grade !== 'all' && row.grade !== f.grade) return false;
        if (periodHours !== null && row.ageHours > periodHours) return false;
        if (f.search.trim().length > 0) {
            const artisan = mockArtisans.find((a) => a.id === row.passport.artisanId);
            const needle = f.search.toLowerCase();
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
}

function PassportsInner() {
    const rows = usePassportRows(mockPassports);
    const audit = useFifoAudit(rows);
    const { selectedId, setSelectedId } = useDeepLinkId();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
    const [tierFilter, setTierFilter] = useState<TierFilter>('all');
    const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

    const filtered = useMemo(
        () =>
            applyFilters(rows, {
                search,
                status: statusFilter,
                tier: tierFilter,
                grade: gradeFilter,
                period: periodFilter,
            }),
        [rows, search, statusFilter, tierFilter, gradeFilter, periodFilter],
    );

    const selectedPassport: Passport | null = useMemo(
        () => (selectedId ? (mockPassports.find((p) => p.id === selectedId) ?? null) : null),
        [selectedId],
    );

    const advancedActiveCount =
        (tierFilter !== 'all' ? 1 : 0) + (gradeFilter !== 'all' ? 1 : 0) + (periodFilter !== 'all' ? 1 : 0);

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setTierFilter('all');
        setGradeFilter('all');
        setPeriodFilter('all');
    };

    return (
        <TooltipProvider>
            <FeatureLayout title="Passeports" actions={<Kpis rows={rows} />}>
                <div className="space-y-8">
                    <div className="space-y-4">
                        <DataTableFilters
                            search={{
                                value: search,
                                onChange: setSearch,
                                placeholder: 'Référence, artisan, ville…',
                            }}
                            filters={[
                                {
                                    label: 'Statut',
                                    value: statusFilter,
                                    onChange: (v) => setStatusFilter(v as StatusFilterValue),
                                    options: STATUS_FILTER_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
                                },
                            ]}
                            onReset={resetFilters}
                            rightSlot={
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAdvancedOpen(true)}
                                    className="gap-1.5"
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Filtres avancés
                                    {advancedActiveCount > 0 ? (
                                        <span className="ml-1 rounded-full bg-lumiris-cyan/15 px-1.5 font-mono text-[10px] text-lumiris-cyan">
                                            {advancedActiveCount}
                                        </span>
                                    ) : null}
                                </Button>
                            }
                        />
                        <FifoViolationsAlert audit={audit} />
                    </div>

                    <BulkActionsBar
                        rows={filtered}
                        selectedIds={selectedIds}
                        onClear={() => setSelectedIds(new Set())}
                    />
                    <PassportTable
                        rows={filtered}
                        onSelect={(p) => setSelectedId(p.id)}
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
                    <PassportDrawer passport={selectedPassport} onClose={() => setSelectedId(null)} />
                </div>

                <Sheet open={advancedOpen} onOpenChange={setAdvancedOpen}>
                    <SheetContent side="right" className="w-96 max-w-[95vw] sm:max-w-96">
                        <SheetHeader>
                            <SheetTitle>Filtres avancés</SheetTitle>
                            <SheetDescription>Tier, grade, période.</SheetDescription>
                        </SheetHeader>
                        <div className="space-y-5 px-5 pb-5">
                            <FilterField label="Tier">
                                <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as TierFilter)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIER_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FilterField>
                            <FilterField label="Grade Iris">
                                <Select value={gradeFilter} onValueChange={(v) => setGradeFilter(v as GradeFilter)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GRADE_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FilterField>
                            <FilterField label="Période">
                                <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PERIOD_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FilterField>
                            {advancedActiveCount > 0 ? (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setTierFilter('all');
                                        setGradeFilter('all');
                                        setPeriodFilter('all');
                                    }}
                                    className="text-muted-foreground"
                                >
                                    Réinitialiser
                                </Button>
                            ) : null}
                        </div>
                    </SheetContent>
                </Sheet>
            </FeatureLayout>
        </TooltipProvider>
    );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-[11px] tracking-wider text-muted-foreground uppercase">{label}</Label>
            {children}
        </div>
    );
}

function PassportsComponent() {
    return (
        <Suspense fallback={null}>
            <CurationStoreProvider>
                <PassportsInner />
            </CurationStoreProvider>
        </Suspense>
    );
}

export const Passports = memo(PassportsComponent);
