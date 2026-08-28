'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Archive,
    Armchair,
    BadgeCheck,
    BatteryCharging,
    Check,
    GitCompareArrows,
    MoreHorizontal,
    PenLine,
    Plus,
    Puzzle,
    Refrigerator,
    ScanQrCode,
    ShieldCheck,
    Shirt,
    ShoppingBag,
    Smartphone,
    SlidersHorizontal,
    TrendingUp,
} from 'lucide-react';
import { GRADE_LABEL, gradeBackgroundSolid, gradeColorVar } from '@lumiris/scoring-ui';
import { mockArtisanById, mockPassportById } from '@lumiris/mock-data';
import type { GarmentKind, IrisGrade, Passport, ScoreResult } from '@lumiris/types';
import { useWardrobe as useBackendWardrobe } from '@lumiris/api-client/react';
import type { WardrobeItemDto } from '@lumiris/api-client';
import { cn } from '@lumiris/ui/lib/cn';
import { useUser } from '@/lib/auth/use-user';
import { routes } from '@/lib/routes';
import { scorePassport } from '@/lib/passport-score';
import { hydrateWardrobeFromApi, useWardrobe, type WardrobeItem, type WardrobeSector } from '@/lib/wardrobe-storage';
import { getGradeDistribution, getOverallScore } from '@/lib/iris/wardrobe-stats';
import { COMPARE_MAX, clearCompare, setCompare, toggleCompare, useCompare } from '@/lib/iris/compare-store';
import { toast } from '@/lib/toast';
import { CarePanel } from './care-panel';
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

interface PublicDppRow {
    kind: 'public-dpp';
    key: string;
    addedAt: string;
    sector: WardrobeSector;
    label: string;
    sublabel: string;
    grade: IrisGrade | null;
    publicCode: string;
}

/** Pièce achetée sur la marketplace (backend). Provenance « achat » — passeport + facture + garantie. */
interface PurchasedVaultRow {
    kind: 'purchased';
    key: string;
    addedAt: string;
    sector: WardrobeSector;
    label: string;
    sublabel: string;
    publicCode: string | null;
    invoiceNumber: string | null;
    warrantyDescription: string | null;
    warrantyUntil: string | null;
}

type VaultRow = ScoredVaultRow | PublicDppRow | ManualVaultRow | PurchasedVaultRow;

/** Provenance d'une pièce — la distinction que voit l'utilisateur (achat vs ajout avec/sans DPP). */
type Provenance = 'purchased' | 'dpp' | 'manual';

function rowProvenance(row: VaultRow): Provenance {
    if (row.kind === 'purchased') return 'purchased';
    if (row.kind === 'scored' || row.kind === 'public-dpp') return 'dpp';
    return 'manual';
}

function rowGrade(row: VaultRow): IrisGrade | null {
    if (row.kind === 'scored') return row.score.grade;
    if (row.kind === 'public-dpp') return row.grade;
    return null;
}

const SUBLABEL_PURCHASED = 'Acheté sur la marketplace';

const PROVENANCE_BADGE: Record<Provenance, { label: string; Icon: typeof ShoppingBag; className: string }> = {
    purchased: {
        label: 'Acheté',
        Icon: ShoppingBag,
        className: 'border-lumiris-emerald/25 bg-lumiris-emerald/10 text-lumiris-emerald',
    },
    dpp: {
        label: 'Passeport',
        Icon: BadgeCheck,
        className: 'border-primary/20 bg-primary/5 text-primary',
    },
    manual: {
        label: 'Sans DPP',
        Icon: PenLine,
        className: 'border-border bg-background/80 text-muted-foreground',
    },
};

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
    if (item.kind === 'public-dpp') {
        return {
            kind: 'public-dpp',
            key: `public:${item.publicCode}`,
            addedAt: item.addedAt,
            sector: 'textile',
            label: item.productName,
            sublabel: 'Passeport numérique',
            grade: (GRADES as readonly string[]).includes(item.grade ?? '') ? (item.grade as IrisGrade) : null,
            publicCode: item.publicCode,
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

// Une échéance datée prime sur la phrase libre de l'atelier : « jusqu'au 12 mars 2028 » se
// vérifie d'un coup d'œil là où « garantie 2 ans » oblige à recalculer depuis la date d'achat.
function warrantyLabel(row: PurchasedVaultRow): string | null {
    if (row.warrantyUntil) {
        const until = new Date(row.warrantyUntil);
        if (!Number.isNaN(until.getTime())) {
            return `Garantie jusqu'au ${until.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            })}`;
        }
    }
    return row.warrantyDescription;
}

function buildPurchasedRow(item: WardrobeItemDto): PurchasedVaultRow {
    return {
        kind: 'purchased',
        key: `purchase:${item.id}`,
        addedAt: item.acquiredAt ?? '',
        sector: 'textile',
        label: item.productName ?? 'Pièce achetée',
        sublabel: SUBLABEL_PURCHASED,
        publicCode: item.dppPublicCode ?? null,
        invoiceNumber: item.invoiceNumber ?? null,
        warrantyDescription: item.warrantyDescription ?? null,
        warrantyUntil: item.warrantyUntil ?? null,
    };
}

export function Vault() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated } = useUser();
    const items = useWardrobe();
    const wardrobeQuery = useBackendWardrobe(user?.id ?? null, { enabled: isAuthenticated });
    const purchased = useMemo(
        () => (isAuthenticated ? (wardrobeQuery.data ?? []).filter((item) => item.origin === 'purchase') : []),
        [isAuthenticated, wardrobeQuery.data],
    );
    const compareIds = useCompare();
    const [now] = useState(() => new Date());
    const [compareMode, setCompareMode] = useState(false);
    const [gradeFilter, setGradeFilter] = useState<IrisGrade | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<VaultFilters>(VAULT_DEFAULT_FILTERS);
    const [actionsTarget, setActionsTarget] = useState<Exclude<VaultRow, PurchasedVaultRow> | null>(null);

    useEffect(() => {
        if (user && wardrobeQuery.data) hydrateWardrobeFromApi(user.id, wardrobeQuery.data);
    }, [user, wardrobeQuery.data]);

    // Une seule grille : les achats marketplace (backend) rejoignent l'inventaire local. Chaque
    // carte porte un badge de provenance — Acheté / Passeport / Sans DPP.
    const rows = useMemo<readonly VaultRow[]>(() => {
        const local = items.map((it) => buildRow(it, now)).filter((r): r is VaultRow => r !== null);
        const bought = purchased.map(buildPurchasedRow);
        return [...bought, ...local];
    }, [items, purchased, now]);

    const scoredRows = useMemo(() => rows.filter((r): r is ScoredVaultRow => r.kind === 'scored'), [rows]);
    const grades = useMemo(() => rows.map(rowGrade).filter((g): g is IrisGrade => g !== null), [rows]);
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
        () =>
            Array.from(
                new Set(
                    rows
                        .map((r) => r.sublabel)
                        .filter(
                            (s) =>
                                s !== '-' &&
                                s !== 'Sans marque' &&
                                s !== 'Passeport numérique' &&
                                s !== SUBLABEL_PURCHASED,
                        ),
                ),
            ),
        [rows],
    );

    const hasActiveFilters =
        filters.sectors.length > 0 ||
        filters.kinds.length > 0 ||
        filters.brands.length > 0 ||
        filters.sort !== 'recent';

    const filteredRows = useMemo(() => {
        const byGrade = gradeFilter ? rows.filter((r) => rowGrade(r) === gradeFilter) : rows;
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
                    const ga = rowGrade(a);
                    const gb = rowGrade(b);
                    return (gb ? GRADE_RANK[gb] : 0) - (ga ? GRADE_RANK[ga] : 0);
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
            if (row.kind === 'public-dpp') router.push(routes.publicPassport(row.publicCode));
            if (row.kind === 'purchased') {
                if (row.publicCode) router.push(routes.publicPassport(row.publicCode));
                else router.push('/me/orders');
            }
        },
        [compareMode, router],
    );

    const onChipTap = useCallback((grade: IrisGrade) => {
        setGradeFilter((prev) => (prev === grade ? null : grade));
    }, []);

    if (rows.length === 0) {
        return (
            <div className="flex h-full flex-col overflow-y-auto bg-background pt-12">
                <VaultEmpty onScan={() => router.push('/')} onAdd={() => router.push('/vault/add')} />
            </div>
        );
    }

    const compareItems = compareIds
        .map((id) => scoredRows.find((r) => r.passport.id === id))
        .filter((r): r is ScoredVaultRow => r !== undefined)
        .map<VaultItem>((r) => ({ passport: r.passport, score: r.score, artisanName: r.artisanName }));
    const remaining = COMPARE_MAX - compareIds.length;

    return (
        <div className="flex h-full flex-col bg-background">
            <motion.header
                className="flex items-center justify-between px-5 pt-12 pb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-xl font-bold text-foreground">Mon inventaire</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {rows.length} produit{rows.length > 1 ? 's' : ''} enregistré{rows.length > 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push('/vault/add')}
                        aria-label="Ajouter un produit"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground"
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
                                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-lumiris-cyan"
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
                {grades.length > 0 ? (
                    <WardrobeHealth grade={overall.grade} percentage={overall.percentage} scoredCount={grades.length} />
                ) : null}

                {grades.length > 0 ? (
                    <DistributionChips distribution={distribution} activeGrade={gradeFilter} onSelect={onChipTap} />
                ) : null}

                <CarePanel items={purchased} />

                <AnimatePresence>
                    {compareMode && remaining > 0 ? (
                        <motion.div
                            className="mb-4 rounded-2xl border border-lumiris-cyan/30 bg-lumiris-cyan/5 px-4 py-3 text-center"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <p className="text-xs font-medium text-lumiris-cyan">
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
                                onOpenActions={() => {
                                    if (row.kind !== 'purchased') setActionsTarget(row);
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {filteredRows.length === 0 ? (
                    <p className="mt-8 text-center text-xs text-muted-foreground">
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
            className="flex h-full flex-col items-center justify-center gap-4 bg-background px-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-border/60 bg-card">
                <Archive className="h-8 w-8 text-muted-foreground" />
                <span
                    className="absolute -inset-3 -z-10 rounded-3xl bg-lumiris-cyan/15 blur-xl motion-reduce:hidden"
                    aria-hidden
                />
            </div>
            <div>
                <h1 className="text-lg font-semibold text-foreground">Inventaire vide</h1>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Scanne un produit ou ajoute-le manuellement à ton inventaire.
                </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                <button
                    type="button"
                    onClick={onScan}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                    <ScanQrCode className="h-4 w-4" />
                    Scanner
                </button>
                <button
                    type="button"
                    onClick={onAdd}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground"
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
            className="mb-5 flex items-center gap-5 rounded-2xl border border-border/60 bg-card p-5"
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
                <h3 className="text-sm font-bold text-foreground">Qualité de votre garde robe</h3>
                <p className="mt-0.5 text-xs font-semibold" style={{ color: stroke }}>
                    {GRADE_LABEL[grade]}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                    Score moyen calculé sur {scoredCount} item{scoredCount > 1 ? 's' : ''} avec DPP.
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-lumiris-cyan/10 px-2.5 py-1.5">
                    <TrendingUp className="h-3 w-3 text-lumiris-cyan" />
                    <span className="text-[11px] font-medium text-lumiris-cyan">{tone}</span>
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
                            'flex flex-1 flex-col items-center gap-0.5 rounded-xl border bg-card py-2.5 transition-colors',
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
    const grade = rowGrade(row);
    const provenance = rowProvenance(row);
    const badge = PROVENANCE_BADGE[provenance];
    const isE = grade === 'E';
    const isA = grade === 'A';
    // Un achat ne s'ajoute ni ne se retire manuellement (il vient du backend) → pas de menu d'actions.
    const hasActions = provenance !== 'purchased';
    const cardStyle: React.CSSProperties = {
        ...(isE ? { filter: 'saturate(0.4) brightness(0.92)' } : {}),
        ...(isA ? { animation: 'iris-grade-a-glow 3s ease-in-out infinite' } : {}),
    };

    const ariaLabel = grade ? `${row.label} - ${badge.label} - grade ${grade}` : `${row.label} - ${badge.label}`;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
            transition={{ delay: 0.25 + index * 0.04 }}
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-colors',
                isSelected ? 'border-lumiris-cyan ring-2 ring-lumiris-cyan/20' : 'border-border/60',
            )}
            style={cardStyle}
        >
            <button type="button" onClick={onTap} className="flex flex-col text-left" aria-label={ariaLabel}>
                {compareMode ? (
                    <div
                        className={cn(
                            'absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                            isSelected ? 'border-lumiris-cyan bg-lumiris-cyan' : 'border-border bg-card/90',
                        )}
                        aria-hidden
                    >
                        {isSelected ? <Check className="h-3 w-3 text-primary-foreground" /> : null}
                    </div>
                ) : (
                    <span
                        className={cn(
                            'absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold backdrop-blur-sm',
                            badge.className,
                        )}
                    >
                        <badge.Icon className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
                        {badge.label}
                    </span>
                )}

                <div className="relative flex h-28 items-center justify-center bg-secondary/50">
                    <Icon className="h-9 w-9 text-muted-foreground/25" aria-hidden />
                    {grade ? (
                        <div
                            className={cn(
                                'absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground',
                                gradeBackgroundSolid(grade),
                            )}
                            aria-label={`Iris grade ${grade}`}
                        >
                            {grade}
                        </div>
                    ) : null}
                </div>

                <div className="p-3">
                    <h4 className="truncate text-xs leading-tight font-semibold text-foreground">{row.label}</h4>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.sublabel}</p>
                    {row.kind === 'scored' ? (
                        <p className="mt-1 text-xs font-bold text-foreground">
                            {row.passport.garment.retailPrice}{' '}
                            {row.passport.garment.currency === 'EUR' ? '€' : row.passport.garment.currency}
                        </p>
                    ) : row.kind === 'public-dpp' ? (
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">{row.publicCode}</p>
                    ) : row.kind === 'purchased' ? (
                        <div className="mt-1 flex flex-col gap-0.5">
                            {row.invoiceNumber ? (
                                <p className="truncate font-mono text-[10px] text-muted-foreground/70">
                                    {row.invoiceNumber}
                                </p>
                            ) : null}
                            {warrantyLabel(row) ? (
                                <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <ShieldCheck className="h-3 w-3 shrink-0 text-lumiris-emerald" aria-hidden />
                                    <span className="truncate">{warrantyLabel(row)}</span>
                                </p>
                            ) : null}
                        </div>
                    ) : (
                        <p className="mt-1 text-[11px] text-muted-foreground/70">Sans DPP</p>
                    )}
                </div>
            </button>

            {!compareMode && hasActions ? (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenActions();
                    }}
                    aria-label={`Actions pour ${row.label}`}
                    className="absolute right-2 bottom-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-md hover:bg-background active:scale-95"
                >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
            ) : null}
        </motion.div>
    );
}
