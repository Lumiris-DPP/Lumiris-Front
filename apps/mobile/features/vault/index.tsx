'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Archive,
    Armchair,
    BatteryCharging,
    Check,
    GitCompareArrows,
    MoreHorizontal,
    Plus,
    Puzzle,
    Refrigerator,
    ScanQrCode,
    Shirt,
    Smartphone,
    SlidersHorizontal,
    TrendingUp,
} from 'lucide-react';
import { GRADE_LABEL, gradeBackgroundSolid, gradeColorVar } from '@lumiris/scoring-ui';
import { mockArtisanById, mockPassportById } from '@lumiris/mock-data';
import type { GarmentKind, IrisGrade, Passport, ScoreResult } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { scorePassport } from '@/lib/passport-score';
import { useWardrobe, type WardrobeItem, type WardrobeSector } from '@/lib/wardrobe-storage';
import { getGradeDistribution, getOverallScore } from '@/lib/iris/wardrobe-stats';
import { COMPARE_MAX, clearCompare, setCompare, toggleCompare, useCompare } from '@/lib/iris/compare-store';
import { toast } from '@/lib/toast';
import { ComparisonOverlay, type VaultItem } from './comparison-overlay';
import { FiltersSheet, VAULT_DEFAULT_FILTERS, type VaultFilters } from './filters-sheet';
import { ItemActionsSheet } from './item-actions-sheet';

const GRADES: readonly IrisGrade[] = ['A', 'B', 'C', 'D', 'E'];
const GRADE_RANK: Record<IrisGrade, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };

const SECTOR_ICON: Record<WardrobeSector, typeof Shirt> = {
    textile: Shirt,
    electronics: Smartphone,
    appliance: Refrigerator,
    furniture: Armchair,
    toy: Puzzle,
    battery: BatteryCharging,
};

interface ScoredVaultRow {
    kind: 'scored';
    key: string;
    addedAt: string;
    sector: WardrobeSector;
    label: string;
    sublabel: string;
    sortPrice: number;
    passport: Passport;
    score: ScoreResult;
    artisanName: string;
}

interface ManualVaultRow {
    kind: 'manual';
    key: string;
    addedAt: string;
    sector: WardrobeSector;
    label: string;
    sublabel: string;
}

type VaultRow = ScoredVaultRow | ManualVaultRow;

function buildRow(item: WardrobeItem, now: Date): VaultRow | null {
    if (item.kind === 'lumiris-passport') {
        const passport = mockPassportById(item.passportId);
        if (!passport) return null;
        const artisan = mockArtisanById(passport.artisanId);
        return {
            kind: 'scored',
            key: `lumiris:${item.passportId}`,
            addedAt: item.addedAt,
            sector: 'textile',
            label: passport.garment.reference,
            sublabel: artisan?.atelierName ?? '-',
            sortPrice: passport.garment.retailPrice,
            passport,
            score: scorePassport(passport, now),
            artisanName: artisan?.atelierName ?? '-',
        };
    }
    if (item.kind === 'manual') {
        return {
            kind: 'manual',
            key: `manual:${item.id}`,
            addedAt: item.addedAt,
            sector: item.sector,
            label: item.productName,
            sublabel: item.brand ?? 'Sans marque',
        };
    }
    // `external-dpp` : masqué tant que mock-data externe pas branchée.
    return null;
}

export function Vault() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const items = useWardrobe();
    const compareIds = useCompare();
    const [now] = useState(() => new Date());
    const [compareMode, setCompareMode] = useState(false);
    const [gradeFilter, setGradeFilter] = useState<IrisGrade | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<VaultFilters>(VAULT_DEFAULT_FILTERS);
    const [actionsTarget, setActionsTarget] = useState<VaultRow | null>(null);

    const rows = useMemo<readonly VaultRow[]>(
        () => items.map((it) => buildRow(it, now)).filter((r): r is VaultRow => r !== null),
        [items, now],
    );

    const scoredRows = useMemo(() => rows.filter((r): r is ScoredVaultRow => r.kind === 'scored'), [rows]);
    const grades = useMemo(() => scoredRows.map((r) => r.score.grade), [scoredRows]);
    const distribution = useMemo(() => getGradeDistribution(grades), [grades]);
    const overall = useMemo(() => getOverallScore(grades), [grades]);

    const availableSectors = useMemo<readonly WardrobeSector[]>(
        () => Array.from(new Set(rows.map((r) => r.sector))),
        [rows],
    );
    const availableKinds = useMemo<readonly GarmentKind[]>(
        () => Array.from(new Set(scoredRows.map((r) => r.passport.garment.kind))),
        [scoredRows],
    );
    const availableBrands = useMemo(
        () => Array.from(new Set(rows.map((r) => r.sublabel).filter((s) => s !== '-' && s !== 'Sans marque'))),
        [rows],
    );

    const hasActiveFilters =
        filters.sectors.length > 0 ||
        filters.kinds.length > 0 ||
        filters.brands.length > 0 ||
        filters.sort !== 'recent';

    const filteredRows = useMemo(() => {
        const byGrade = gradeFilter ? rows.filter((r) => r.kind === 'scored' && r.score.grade === gradeFilter) : rows;
        const bySector = filters.sectors.length ? byGrade.filter((r) => filters.sectors.includes(r.sector)) : byGrade;
        const byKind = filters.kinds.length
            ? bySector.filter((r) => r.kind === 'scored' && filters.kinds.includes(r.passport.garment.kind))
            : bySector;
        const byBrand = filters.brands.length ? byKind.filter((r) => filters.brands.includes(r.sublabel)) : byKind;
        const sorted = [...byBrand];
        switch (filters.sort) {
            case 'oldest':
                sorted.sort((a, b) => a.addedAt.localeCompare(b.addedAt));
                break;
            case 'grade-desc':
                sorted.sort((a, b) => {
                    const ga = a.kind === 'scored' ? GRADE_RANK[a.score.grade] : 0;
                    const gb = b.kind === 'scored' ? GRADE_RANK[b.score.grade] : 0;
                    return gb - ga;
                });
                break;
            case 'price-asc':
                sorted.sort((a, b) => {
                    const pa = a.kind === 'scored' ? a.sortPrice : Number.POSITIVE_INFINITY;
                    const pb = b.kind === 'scored' ? b.sortPrice : Number.POSITIVE_INFINITY;
                    return pa - pb;
                });
                break;
            case 'price-desc':
                sorted.sort((a, b) => {
                    const pa = a.kind === 'scored' ? a.sortPrice : Number.NEGATIVE_INFINITY;
                    const pb = b.kind === 'scored' ? b.sortPrice : Number.NEGATIVE_INFINITY;
                    return pb - pa;
                });
                break;
            case 'recent':
            default:
                sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
                break;
        }
        return sorted;
    }, [rows, gradeFilter, filters]);

    const autoComparePinned = useRef(false);
    useEffect(() => {
        if (autoComparePinned.current) return;
        const target = searchParams.get('compareWith');
        if (!target) return;
        if (!scoredRows.some((r) => r.passport.id === target)) return;
        autoComparePinned.current = true;
        setCompare([target]);
        setCompareMode(true);
        toast.info('Sélectionne une 2e pièce à comparer');
    }, [searchParams, scoredRows]);

    useEffect(() => {
        if (compareIds.length === COMPARE_MAX && !showComparison) {
            const id = window.setTimeout(() => setShowComparison(true), 200);
            return () => window.clearTimeout(id);
        }
        return undefined;
    }, [compareIds, showComparison]);

    const exitCompare = useCallback(() => {
        setShowComparison(false);
        setCompareMode(false);
        clearCompare();
    }, []);

    useEffect(() => () => clearCompare(), []);

    const onToggleCompareMode = useCallback(() => {
        if (compareMode) {
            exitCompare();
        } else {
            setCompareMode(true);
        }
    }, [compareMode, exitCompare]);

    const onCardTap = useCallback(
        (row: VaultRow) => {
            if (compareMode) {
                if (row.kind !== 'scored') {
                    toast.info('Comparable seulement avec un passeport.');
                    return;
                }
                toggleCompare(row.passport.id);
                return;
            }
            if (row.kind === 'scored') router.push(`/passeport/${row.passport.id}`);
        },
        [compareMode, router],
    );

    const onChipTap = useCallback((grade: IrisGrade) => {
        setGradeFilter((prev) => (prev === grade ? null : grade));
    }, []);

    if (rows.length === 0) {
        return <VaultEmpty onScan={() => router.push('/')} onAdd={() => router.push('/vault/add')} />;
    }

    const compareItems = compareIds
        .map((id) => scoredRows.find((r) => r.passport.id === id))
        .filter((r): r is ScoredVaultRow => r !== undefined)
        .map<VaultItem>((r) => ({ passport: r.passport, score: r.score, artisanName: r.artisanName }));
    const remaining = COMPARE_MAX - compareIds.length;

    return (
        <div className="bg-background flex h-full flex-col">
            <motion.header
                className="flex items-center justify-between px-5 pb-4 pt-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-foreground text-xl font-bold">Mon inventaire</h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        {rows.length} produit{rows.length > 1 ? 's' : ''} enregistré{rows.length > 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push('/vault/add')}
                        aria-label="Ajouter un produit"
                        className="border-border bg-card text-foreground inline-flex h-8 w-8 items-center justify-center rounded-full border"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen(true)}
                        aria-label="Filtres et tri"
                        aria-pressed={hasActiveFilters}
                        className={cn(
                            'relative inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                            hasActiveFilters
                                ? 'border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan'
                                : 'border-border bg-card text-foreground',
                        )}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        {hasActiveFilters ? (
                            <span
                                className="bg-lumiris-cyan absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
                                aria-hidden
                            />
                        ) : null}
                    </button>
                    <button
                        type="button"
                        onClick={onToggleCompareMode}
                        aria-pressed={compareMode}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                            compareMode
                                ? 'border-lumiris-cyan bg-lumiris-cyan/10 text-lumiris-cyan'
                                : 'border-border bg-card text-foreground',
                        )}
                    >
                        <GitCompareArrows className="h-3.5 w-3.5" />
                        {compareMode ? 'Annuler' : 'Comparer'}
                    </button>
                </div>
            </motion.header>

            <div className="flex-1 overflow-y-auto px-5 pb-28">
                {scoredRows.length > 0 ? (
                    <WardrobeHealth
                        grade={overall.grade}
                        percentage={overall.percentage}
                        scoredCount={scoredRows.length}
                    />
                ) : null}

                {scoredRows.length > 0 ? (
                    <DistributionChips distribution={distribution} activeGrade={gradeFilter} onSelect={onChipTap} />
                ) : null}

                <AnimatePresence>
                    {compareMode && remaining > 0 ? (
                        <motion.div
                            className="border-lumiris-cyan/30 bg-lumiris-cyan/5 mb-4 rounded-2xl border px-4 py-3 text-center"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <p className="text-lumiris-cyan text-xs font-medium">
                                Sélectionne {remaining} autre{remaining > 1 ? 's' : ''} produit
                                {remaining > 1 ? 's' : ''} à passeport pour comparer
                            </p>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-3">
                    <AnimatePresence initial={false}>
                        {filteredRows.map((row, idx) => (
                            <VaultCard
                                key={row.key}
                                row={row}
                                index={idx}
                                compareMode={compareMode}
                                isSelected={row.kind === 'scored' && compareIds.includes(row.passport.id)}
                                onTap={() => onCardTap(row)}
                                onOpenActions={() => setActionsTarget(row)}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {filteredRows.length === 0 ? (
                    <p className="text-muted-foreground mt-8 text-center text-xs">
                        Aucun produit ne correspond aux filtres.
                    </p>
                ) : null}
            </div>

            <FiltersSheet
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                availableSectors={availableSectors}
                availableKinds={availableKinds}
                availableBrands={availableBrands}
                value={filters}
                onApply={setFilters}
            />

            <ItemActionsSheet
                open={actionsTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setActionsTarget(null);
                }}
                target={actionsTarget}
            />

            <AnimatePresence>
                {showComparison && compareItems.length === COMPARE_MAX ? (
                    <ComparisonOverlay items={compareItems} onClose={exitCompare} />
                ) : null}
            </AnimatePresence>
        </div>
    );
}

function VaultEmpty({ onScan, onAdd }: { onScan: () => void; onAdd: () => void }) {
    return (
        <motion.div
            className="bg-background flex h-full flex-col items-center justify-center gap-4 px-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="border-border/60 bg-card relative flex h-20 w-20 items-center justify-center rounded-3xl border">
                <Archive className="text-muted-foreground h-8 w-8" />
                <span
                    className="bg-lumiris-cyan/15 absolute -inset-3 -z-10 rounded-3xl blur-xl motion-reduce:hidden"
                    aria-hidden
                />
            </div>
            <div>
                <h1 className="text-foreground text-lg font-semibold">Inventaire vide</h1>
                <p className="text-muted-foreground mt-1 max-w-xs text-sm">
                    Scanne un produit ou ajoute-le manuellement à ton inventaire.
                </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                <button
                    type="button"
                    onClick={onScan}
                    className="bg-foreground text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                    <ScanQrCode className="h-4 w-4" />
                    Scanner
                </button>
                <button
                    type="button"
                    onClick={onAdd}
                    className="border-border bg-card text-foreground inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter
                </button>
            </div>
        </motion.div>
    );
}

interface WardrobeHealthProps {
    grade: IrisGrade;
    percentage: number;
    scoredCount: number;
}

function WardrobeHealth({ grade, percentage, scoredCount }: WardrobeHealthProps) {
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const stroke = gradeColorVar(grade);
    const tone = percentage >= 60 ? 'Inventaire bien suivi' : 'Marge de progression';

    return (
        <motion.div
            className="border-border/60 bg-card mb-5 flex items-center gap-5 rounded-2xl border p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="4" className="stroke-secondary" />
                    {/* `key` retrigger l'animation au changement de grade. */}
                    <motion.circle
                        key={grade}
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke={stroke}
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference * (1 - percentage / 100) }}
                        transition={{ delay: 0.3, duration: 1.2, ease: 'easeOut' }}
                    />
                </svg>
                <span className="absolute text-2xl font-bold" style={{ color: stroke }}>
                    {grade}
                </span>
            </div>

            <div className="flex-1">
                <h3 className="text-foreground text-sm font-bold">Inventory Health</h3>
                <p className="mt-0.5 text-xs font-semibold" style={{ color: stroke }}>
                    {GRADE_LABEL[grade]}
                </p>
                <p className="text-muted-foreground mt-1 text-[11px]">
                    Score moyen calculé sur {scoredCount} item{scoredCount > 1 ? 's' : ''} avec DPP.
                </p>
                <div className="bg-lumiris-emerald/10 mt-2.5 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5">
                    <TrendingUp className="text-lumiris-emerald h-3 w-3" />
                    <span className="text-lumiris-emerald text-[11px] font-medium">{tone}</span>
                </div>
            </div>
        </motion.div>
    );
}

interface DistributionChipsProps {
    distribution: Record<IrisGrade, number>;
    activeGrade: IrisGrade | null;
    onSelect: (grade: IrisGrade) => void;
}

function DistributionChips({ distribution, activeGrade, onSelect }: DistributionChipsProps) {
    return (
        <motion.div
            className="mb-5 flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            role="group"
            aria-label="Filtrer par grade"
        >
            {GRADES.map((grade) => {
                const count = distribution[grade];
                const active = activeGrade === grade;
                const cssVar = gradeColorVar(grade);
                return (
                    <button
                        key={grade}
                        type="button"
                        onClick={() => onSelect(grade)}
                        aria-pressed={active}
                        className={cn(
                            'bg-card flex flex-1 flex-col items-center gap-0.5 rounded-xl border py-2.5 transition-colors',
                            active ? 'border-current shadow-sm' : 'border-border/40',
                        )}
                        style={active ? { color: cssVar } : undefined}
                    >
                        <span className="text-base font-bold" style={{ color: cssVar }}>
                            {count}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: cssVar }}>
                            {grade}
                        </span>
                    </button>
                );
            })}
        </motion.div>
    );
}

interface VaultCardProps {
    row: VaultRow;
    index: number;
    compareMode: boolean;
    isSelected: boolean;
    onTap: () => void;
    onOpenActions: () => void;
}

function VaultCard({ row, index, compareMode, isSelected, onTap, onOpenActions }: VaultCardProps) {
    const Icon = SECTOR_ICON[row.sector];
    const grade = row.kind === 'scored' ? row.score.grade : null;
    const isE = grade === 'E';
    const isA = grade === 'A';
    const cardStyle: React.CSSProperties = {
        ...(isE ? { filter: 'saturate(0.4) brightness(0.92)' } : {}),
        ...(isA ? { animation: 'iris-grade-a-glow 3s ease-in-out infinite' } : {}),
    };

    const ariaLabel = row.kind === 'scored' ? `${row.label} - grade ${grade}` : `${row.label} - sans passeport`;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
            transition={{ delay: 0.25 + index * 0.04 }}
            className={cn(
                'bg-card group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-colors',
                isSelected ? 'border-lumiris-cyan ring-lumiris-cyan/20 ring-2' : 'border-border/60',
            )}
            style={cardStyle}
        >
            <button type="button" onClick={onTap} className="flex flex-col text-left" aria-label={ariaLabel}>
                {compareMode ? (
                    <div
                        className={cn(
                            'absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                            isSelected ? 'border-lumiris-cyan bg-lumiris-cyan' : 'border-border bg-card/90',
                        )}
                        aria-hidden
                    >
                        {isSelected ? <Check className="text-primary-foreground h-3 w-3" /> : null}
                    </div>
                ) : null}

                <div className="bg-secondary/50 relative flex h-28 items-center justify-center">
                    <Icon className="text-muted-foreground/25 h-9 w-9" aria-hidden />
                    {grade ? (
                        <div
                            className={cn(
                                'text-primary-foreground absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold',
                                gradeBackgroundSolid(grade),
                            )}
                            aria-label={`Iris grade ${grade}`}
                        >
                            {grade}
                        </div>
                    ) : (
                        <div className="border-border bg-background/80 text-muted-foreground absolute right-2 top-2 inline-flex h-7 items-center justify-center rounded-full border px-2 text-[10px] font-semibold">
                            DIY
                        </div>
                    )}
                </div>

                <div className="p-3">
                    <h4 className="text-foreground truncate text-xs font-semibold leading-tight">{row.label}</h4>
                    <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{row.sublabel}</p>
                    {row.kind === 'scored' ? (
                        <p className="text-foreground mt-1 text-xs font-bold">
                            {row.passport.garment.retailPrice}{' '}
                            {row.passport.garment.currency === 'EUR' ? '€' : row.passport.garment.currency}
                        </p>
                    ) : (
                        <p className="text-muted-foreground/70 mt-1 text-[11px]">Sans DPP</p>
                    )}
                </div>
            </button>

            {!compareMode ? (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenActions();
                    }}
                    aria-label={`Actions pour ${row.label}`}
                    className="border-border bg-background/80 text-foreground hover:bg-background absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-md active:scale-95"
                >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
            ) : null}
        </motion.div>
    );
}
