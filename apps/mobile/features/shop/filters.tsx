'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@lumiris/ui/lib/cn';
import { categoryLabel, materialLabel } from './labels';

export interface ShopFilterOptions {
    categories: readonly string[];
    materials: readonly string[];
    origins: readonly string[];
}

export interface ShopFilterState {
    category?: string;
    material?: string;
    origin?: string;
}

interface ShopFiltersProps {
    options: ShopFilterOptions;
    state: ShopFilterState;
    onChange: (next: ShopFilterState) => void;
}

// Filtres combinables : une valeur par dimension (catégorie ET matière ET origine),
// re-cliquer désélectionne. Le filtrage est appliqué côté serveur (recherche auditée).
// Égalité tolérante casse/espaces : le slug de route (GarmentKind) et la saisie libre de
// l'artisan (`item.category`) ne coïncident pas toujours à l'octet près (cf. applyFilters).
function eq(a: string | undefined, b: string | undefined): boolean {
    return a != null && b != null && a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function ShopFilters({ options, state, onChange }: ShopFiltersProps) {
    const activeCount = [state.category, state.material, state.origin].filter(Boolean).length;

    const toggle = (key: keyof ShopFilterState, value: string) =>
        onChange({ ...state, [key]: eq(state[key], value) ? undefined : value });

    // La catégorie peut être pré-remplie par la route (/shop/[category]) avec un slug absent
    // du catalogue : on l'ajoute pour qu'elle reste visible et déselectionnable (sinon
    // « Réinitialiser (1) » s'afficherait sans aucune puce active correspondante).
    const categoryOptions =
        state.category && !options.categories.some((c) => eq(c, state.category))
            ? [state.category, ...options.categories]
            : options.categories;

    return (
        <motion.div
            className="px-5 pb-3"
            aria-label="Filtres"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
        >
            <FilterRow label="Catégorie">
                {categoryOptions.map((value) => (
                    <FilterChip
                        key={value}
                        active={eq(state.category, value)}
                        onClick={() => toggle('category', value)}
                    >
                        {categoryLabel(value)}
                    </FilterChip>
                ))}
            </FilterRow>

            {options.materials.length > 0 ? (
                <FilterRow label="Matière">
                    {options.materials.map((value) => (
                        <FilterChip
                            key={value}
                            active={eq(state.material, value)}
                            onClick={() => toggle('material', value)}
                        >
                            {materialLabel(value)}
                        </FilterChip>
                    ))}
                </FilterRow>
            ) : null}

            {options.origins.length > 0 ? (
                <FilterRow label="Origine">
                    {options.origins.map((value) => (
                        <FilterChip
                            key={value}
                            active={eq(state.origin, value)}
                            onClick={() => toggle('origin', value)}
                        >
                            {value}
                        </FilterChip>
                    ))}
                </FilterRow>
            ) : null}

            {activeCount > 0 ? (
                <button
                    type="button"
                    onClick={() => onChange({})}
                    className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1 text-[11px] font-medium"
                >
                    <X className="h-3 w-3" strokeWidth={2} aria-hidden />
                    Réinitialiser ({activeCount})
                </button>
            ) : null}
        </motion.div>
    );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="mb-2">
            <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
            <div role="group" aria-label={label} className="flex gap-2 overflow-x-auto pb-1">
                {children}
            </div>
        </div>
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
                'inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-foreground hover:border-foreground/50',
            )}
        >
            {active ? <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden /> : null}
            {children}
        </button>
    );
}
