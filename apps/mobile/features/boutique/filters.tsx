'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Check, SlidersHorizontal, X } from 'lucide-react';
import type { Fiber, GarmentKind, IrisGrade } from '@lumiris/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@lumiris/ui/components/sheet';
import { Slider } from '@lumiris/ui/components/slider';
import { cn } from '@lumiris/ui/lib/cn';
import { GARMENT_KIND_LABEL } from '@/lib/shop';
import {
    MARKETPLACE_SORT_LABEL,
    MARKETPLACE_SORT_ORDER,
    type MarketplaceItem,
    type MarketplaceSort,
} from '@/lib/marketplace';

const CATEGORY_OPTIONS: readonly GarmentKind[] = ['sweater', 'shirt', 'jacket', 'trouser', 'shoe', 'accessory'];
const GRADE_OPTIONS: readonly IrisGrade[] = ['A', 'B', 'C', 'D', 'E'];

const FIBER_LABEL: Record<Fiber, string> = {
    wool: 'Laine',
    linen: 'Lin',
    cotton: 'Coton',
    silk: 'Soie',
    hemp: 'Chanvre',
    leather: 'Cuir',
    cashmere: 'Cachemire',
    'recycled-polyester': 'Polyester recyclé',
    other: 'Autre',
};

interface PriceBounds {
    min: number;
    max: number;
}

export interface BoutiqueFiltersState {
    categories: readonly GarmentKind[];
    grades: readonly IrisGrade[];
    fibers: readonly Fiber[];
    /** Fourchette de prix [min, max] en euros, ou null si non bornée. */
    priceRange: readonly [number, number] | null;
    sort: MarketplaceSort;
}

export const EMPTY_BOUTIQUE_FILTERS: BoutiqueFiltersState = {
    categories: [],
    grades: [],
    fibers: [],
    priceRange: null,
    sort: 'relevance',
};

/** Matière dominante d'une pièce (plus fort pourcentage). */
function dominantFiber(item: MarketplaceItem): Fiber | null {
    const materials = item.passport.materials;
    if (materials.length === 0) return null;
    return materials.reduce((top, m) => (m.percentage > top.percentage ? m : top)).fiber;
}

/** Bornes de prix observées sur l'ensemble des pièces en vente. */
export function priceBoundsOf(items: readonly MarketplaceItem[]): PriceBounds {
    if (items.length === 0) return { min: 0, max: 0 };
    const prices = items.map((i) => i.passport.garment.retailPrice);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

/** Options de matières réellement présentes dans le catalogue. */
export function fiberOptionsOf(items: readonly MarketplaceItem[]): readonly Fiber[] {
    const set = new Set<Fiber>();
    for (const item of items) {
        const fiber = dominantFiber(item);
        if (fiber) set.add(fiber);
    }
    return [...set];
}

export function applyBoutiqueFilters(
    items: readonly MarketplaceItem[],
    state: BoutiqueFiltersState,
): readonly MarketplaceItem[] {
    return items.filter((item) => {
        if (state.categories.length > 0 && !state.categories.includes(item.passport.garment.kind)) return false;
        if (state.grades.length > 0 && !state.grades.includes(item.score.grade)) return false;
        if (state.fibers.length > 0) {
            const fiber = dominantFiber(item);
            if (!fiber || !state.fibers.includes(fiber)) return false;
        }
        if (state.priceRange) {
            const price = item.passport.garment.retailPrice;
            if (price < state.priceRange[0] || price > state.priceRange[1]) return false;
        }
        return true;
    });
}

function activeBoutiqueFilterCount(state: BoutiqueFiltersState): number {
    return state.categories.length + state.grades.length + state.fibers.length + (state.priceRange ? 1 : 0);
}

interface BoutiqueFiltersProps {
    state: BoutiqueFiltersState;
    onChange: (next: BoutiqueFiltersState) => void;
    resultCount: number;
    priceBounds: PriceBounds;
    fiberOptions: readonly Fiber[];
}

/** Barre sticky : tri rapide + déclencheur de la modale de filtres. */
export function BoutiqueFilters({ state, onChange, resultCount, priceBounds, fiberOptions }: BoutiqueFiltersProps) {
    const [open, setOpen] = useState(false);
    const activeCount = activeBoutiqueFilterCount(state);

    return (
        <motion.div
            className="bg-background/85 sticky top-0 z-30 flex items-center gap-2 px-5 pb-3 pt-2 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
        >
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors',
                    activeCount > 0
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:border-foreground/40',
                )}
            >
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                Filtres
                {activeCount > 0 ? (
                    <span className="bg-primary-foreground/20 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] tabular-nums">
                        {activeCount}
                    </span>
                ) : null}
            </button>

            <label className="border-border bg-card text-foreground relative ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pl-3 pr-2 text-xs font-semibold">
                <ArrowUpDown className="text-muted-foreground h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                <span className="sr-only">Trier par</span>
                <select
                    value={state.sort}
                    onChange={(e) => onChange({ ...state, sort: e.target.value as MarketplaceSort })}
                    className="bg-transparent pr-1 text-xs font-semibold outline-none"
                    aria-label="Trier les pièces"
                >
                    {MARKETPLACE_SORT_ORDER.map((sort) => (
                        <option key={sort} value={sort}>
                            {MARKETPLACE_SORT_LABEL[sort]}
                        </option>
                    ))}
                </select>
            </label>

            <BoutiqueFilterSheet
                open={open}
                onOpenChange={setOpen}
                state={state}
                onChange={onChange}
                resultCount={resultCount}
                priceBounds={priceBounds}
                fiberOptions={fiberOptions}
            />
        </motion.div>
    );
}

interface SheetProps extends BoutiqueFiltersProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function BoutiqueFilterSheet({
    open,
    onOpenChange,
    state,
    onChange,
    resultCount,
    priceBounds,
    fiberOptions,
}: SheetProps) {
    const priceEnabled = priceBounds.max > priceBounds.min;
    const range = state.priceRange ?? [priceBounds.min, priceBounds.max];

    function toggle<T>(list: readonly T[], value: T): readonly T[] {
        return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="mx-auto max-h-[88vh] max-w-md overflow-y-auto rounded-t-3xl px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-6"
            >
                <SheetHeader className="px-0 text-left">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <SlidersHorizontal className="text-primary h-4 w-4" strokeWidth={1.5} aria-hidden />
                        Filtres
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                        Affine par catégorie, score Iris, matière et budget.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-5 flex flex-col gap-6">
                    <FilterGroup label="Catégorie">
                        {CATEGORY_OPTIONS.map((kind) => (
                            <FilterChip
                                key={kind}
                                active={state.categories.includes(kind)}
                                onClick={() => onChange({ ...state, categories: toggle(state.categories, kind) })}
                            >
                                {GARMENT_KIND_LABEL[kind]}
                            </FilterChip>
                        ))}
                    </FilterGroup>

                    <FilterGroup label="Score Iris">
                        {GRADE_OPTIONS.map((grade) => (
                            <FilterChip
                                key={grade}
                                active={state.grades.includes(grade)}
                                onClick={() => onChange({ ...state, grades: toggle(state.grades, grade) })}
                            >
                                {grade}
                            </FilterChip>
                        ))}
                    </FilterGroup>

                    {fiberOptions.length > 0 ? (
                        <FilterGroup label="Matière principale">
                            {fiberOptions.map((fiber) => (
                                <FilterChip
                                    key={fiber}
                                    active={state.fibers.includes(fiber)}
                                    onClick={() => onChange({ ...state, fibers: toggle(state.fibers, fiber) })}
                                >
                                    {FIBER_LABEL[fiber]}
                                </FilterChip>
                            ))}
                        </FilterGroup>
                    ) : null}

                    <fieldset className="flex flex-col gap-3">
                        <legend className="text-muted-foreground flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                            <span>Budget</span>
                            <span className="text-foreground font-mono tabular-nums">
                                {range[0]} € – {range[1]} €
                            </span>
                        </legend>
                        <Slider
                            min={priceBounds.min}
                            max={priceBounds.max}
                            step={10}
                            value={[range[0], range[1]]}
                            onValueChange={([min, max]) =>
                                onChange({
                                    ...state,
                                    priceRange: [min ?? priceBounds.min, max ?? priceBounds.max],
                                })
                            }
                            disabled={!priceEnabled}
                            aria-label="Fourchette de prix en euros"
                        />
                    </fieldset>
                </div>

                <div className="mt-7 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onChange({ ...EMPTY_BOUTIQUE_FILTERS, sort: state.sort })}
                        className="text-muted-foreground hover:text-foreground inline-flex h-12 items-center justify-center gap-1.5 px-4 text-sm font-medium"
                    >
                        <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        Réinitialiser
                    </button>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="bg-foreground text-background inline-flex h-12 flex-1 items-center justify-center rounded-full px-6 text-sm font-semibold active:scale-[0.98]"
                    >
                        Voir {resultCount} résultat{resultCount > 1 ? 's' : ''}
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <fieldset className="flex flex-col gap-3">
            <legend className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                {label}
            </legend>
            <div className="flex flex-wrap gap-2">{children}</div>
        </fieldset>
    );
}

function FilterChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-card text-muted-foreground hover:text-foreground',
            )}
        >
            {active ? <Check className="h-3 w-3" strokeWidth={2} aria-hidden /> : null}
            {children}
        </button>
    );
}
