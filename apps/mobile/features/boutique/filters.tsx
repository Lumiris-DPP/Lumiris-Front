'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Check, SlidersHorizontal, X } from 'lucide-react';
import type { IrisGrade } from '@lumiris/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@lumiris/ui/components/sheet';
import { Slider } from '@lumiris/ui/components/slider';
import { cn } from '@lumiris/ui/lib/cn';
import {
    MARKETPLACE_SORT_LABEL,
    MARKETPLACE_SORT_ORDER,
    type MarketplaceItem,
    type MarketplaceSort,
} from '@/lib/marketplace';

const GRADE_OPTIONS: readonly IrisGrade[] = ['A', 'B', 'C', 'D', 'E'];

function titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

interface PriceBounds {
    min: number;
    max: number;
}

export interface BoutiqueFiltersState {
    /** Catégories produit (chaînes réelles du catalogue). */
    categories: readonly string[];
    grades: readonly IrisGrade[];
    /** Matières dominantes (chaînes réelles du catalogue). */
    materials: readonly string[];
    /** Fourchette de prix [min, max] en euros, ou null si non bornée. */
    priceRange: readonly [number, number] | null;
    sort: MarketplaceSort;
}

export const EMPTY_BOUTIQUE_FILTERS: BoutiqueFiltersState = {
    categories: [],
    grades: [],
    materials: [],
    priceRange: null,
    sort: 'relevance',
};

/** Bornes de prix observées sur l'ensemble des pièces en vente. */
export function priceBoundsOf(items: readonly MarketplaceItem[]): PriceBounds {
    if (items.length === 0) return { min: 0, max: 0 };
    const prices = items.map((i) => i.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

/** Options de catégories réellement présentes dans le catalogue. */
export function categoryOptionsOf(items: readonly MarketplaceItem[]): readonly string[] {
    const set = new Set<string>();
    for (const item of items) if (item.category) set.add(item.category);
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
}

/** Options de matières réellement présentes dans le catalogue. */
export function materialOptionsOf(items: readonly MarketplaceItem[]): readonly string[] {
    const set = new Set<string>();
    for (const item of items) if (item.material) set.add(item.material);
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function applyBoutiqueFilters(
    items: readonly MarketplaceItem[],
    state: BoutiqueFiltersState,
): readonly MarketplaceItem[] {
    return items.filter((item) => {
        if (state.categories.length > 0 && (!item.category || !state.categories.includes(item.category))) return false;
        if (state.grades.length > 0 && (!item.irisGrade || !state.grades.includes(item.irisGrade))) return false;
        if (state.materials.length > 0 && (!item.material || !state.materials.includes(item.material))) return false;
        if (state.priceRange) {
            if (item.price < state.priceRange[0] || item.price > state.priceRange[1]) return false;
        }
        return true;
    });
}

function activeBoutiqueFilterCount(state: BoutiqueFiltersState): number {
    return state.categories.length + state.grades.length + state.materials.length + (state.priceRange ? 1 : 0);
}

interface BoutiqueFiltersProps {
    state: BoutiqueFiltersState;
    onChange: (next: BoutiqueFiltersState) => void;
    resultCount: number;
    priceBounds: PriceBounds;
    categoryOptions: readonly string[];
    materialOptions: readonly string[];
}

/** Barre sticky : tri rapide + déclencheur de la modale de filtres. */
export function BoutiqueFilters({
    state,
    onChange,
    resultCount,
    priceBounds,
    categoryOptions,
    materialOptions,
}: BoutiqueFiltersProps) {
    const [open, setOpen] = useState(false);
    const activeCount = activeBoutiqueFilterCount(state);

    return (
        <motion.div
            className="sticky top-0 z-30 flex items-center gap-2 bg-background/85 px-5 pt-2 pb-3 backdrop-blur-xl"
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
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-[10px] tabular-nums">
                        {activeCount}
                    </span>
                ) : null}
            </button>

            <label className="relative ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card py-1.5 pr-2 pl-3 text-xs font-semibold text-foreground">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
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
                categoryOptions={categoryOptions}
                materialOptions={materialOptions}
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
    categoryOptions,
    materialOptions,
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
                className="mx-auto max-h-[88vh] max-w-md overflow-y-auto rounded-t-3xl px-6 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
            >
                <SheetHeader className="px-0 text-left">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <SlidersHorizontal className="h-4 w-4 text-primary" strokeWidth={1.5} aria-hidden />
                        Filtres
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                        Affine par catégorie, score Iris, matière et budget.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-5 flex flex-col gap-6">
                    {categoryOptions.length > 0 ? (
                        <FilterGroup label="Catégorie">
                            {categoryOptions.map((cat) => (
                                <FilterChip
                                    key={cat}
                                    active={state.categories.includes(cat)}
                                    onClick={() => onChange({ ...state, categories: toggle(state.categories, cat) })}
                                >
                                    {titleCase(cat)}
                                </FilterChip>
                            ))}
                        </FilterGroup>
                    ) : null}

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

                    {materialOptions.length > 0 ? (
                        <FilterGroup label="Matière principale">
                            {materialOptions.map((material) => (
                                <FilterChip
                                    key={material}
                                    active={state.materials.includes(material)}
                                    onClick={() => onChange({ ...state, materials: toggle(state.materials, material) })}
                                >
                                    {titleCase(material)}
                                </FilterChip>
                            ))}
                        </FilterGroup>
                    ) : null}

                    <fieldset className="flex flex-col gap-3">
                        <legend className="flex w-full items-center justify-between text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            <span>Budget</span>
                            <span className="font-mono text-foreground tabular-nums">
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
                        className="inline-flex h-12 items-center justify-center gap-1.5 px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        Réinitialiser
                    </button>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background active:scale-[0.98]"
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
            <legend className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
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
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
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
