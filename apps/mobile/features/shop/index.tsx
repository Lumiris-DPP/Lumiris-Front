'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingBag } from 'lucide-react';
import { useMarketplaceSearch } from '@lumiris/api-client/react';
import type { MarketplaceItem } from '@lumiris/api-client';
import { ProductCard } from './product-card';
import { ShopFilters, type ShopFilterOptions, type ShopFilterState } from './filters';
import { useAffinityCategories } from './use-affinity-categories';
import { useOnlineStatus } from '@/lib/network/use-online-status';

interface ShopProps {
    initialCategory?: string;
}

export function Shop({ initialCategory }: ShopProps) {
    const online = useOnlineStatus();
    const affinity = useAffinityCategories();
    const [filters, setFilters] = useState<ShopFilterState>({ category: initialCategory });

    // Une seule requête : catalogue complet, trié côté serveur (tri neutre + reco perso
    // auditée). Les options de filtre et le filtrage catégorie/matière/origine se dérivent
    // de ce même jeu de données — pas de second aller-retour réseau.
    // `affinity` est déjà vide si l'utilisateur n'est pas connecté (cf. useAffinityCategories).
    const personalize = affinity.length > 0 ? affinity : undefined;
    const search = useMarketplaceSearch({ sort: 'relevance', personalize });
    const allItems = useMemo(() => search.data?.items ?? [], [search.data]);

    const options = useMemo<ShopFilterOptions>(() => deriveOptions(allItems), [allItems]);
    const items = useMemo(() => applyFilters(allItems, filters), [allItems, filters]);

    return (
        <div className="bg-background flex h-full flex-col">
            <motion.header className="px-5 pb-3 pt-12" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2">
                    <h1 className="text-foreground text-xl font-bold">Marketplace</h1>
                    <ShoppingBag className="text-muted-foreground h-4 w-4" aria-hidden />
                </div>
                {personalize ? (
                    <p className="text-primary mt-0.5 inline-flex items-center gap-1 text-sm font-medium">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        Recommandé pour vous
                    </p>
                ) : (
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Ateliers vérifiés — tri neutre, sans commission
                    </p>
                )}
            </motion.header>

            <ShopFilters options={options} state={filters} onChange={setFilters} />

            <div className="flex-1 overflow-y-auto px-5 pb-28">
                {search.isPending ? (
                    <ShopSkeleton />
                ) : search.isError ? (
                    <ShopError online={online} onRetry={() => search.refetch()} />
                ) : items.length === 0 ? (
                    <ShopEmpty />
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {items.map((item, idx) => (
                            <ProductCard key={item.id} item={item} index={idx} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function deriveOptions(items: readonly MarketplaceItem[]): ShopFilterOptions {
    const categories = new Set<string>();
    const materials = new Set<string>();
    const origins = new Set<string>();
    for (const item of items) {
        if (item.category) categories.add(item.category);
        if (item.material) materials.add(item.material);
        if (item.originCountry) origins.add(item.originCountry);
    }
    const sorted = (set: Set<string>) => [...set].sort((a, b) => a.localeCompare(b, 'fr'));
    return { categories: sorted(categories), materials: sorted(materials), origins: sorted(origins) };
}

// Filtres combinables appliqués au catalogue déjà trié (l'ordre du tri est préservé).
// Comparaison normalisée (trim + casse) : le slug de route (GarmentKind) et la saisie libre
// de l'artisan (`item.category`) ne coïncident pas toujours à l'octet près.
function applyFilters(items: readonly MarketplaceItem[], f: ShopFilterState): MarketplaceItem[] {
    const match = (value: string | null | undefined, selected?: string) =>
        !selected || (value != null && value.trim().toLowerCase() === selected.trim().toLowerCase());
    return items.filter(
        (item) =>
            match(item.category, f.category) && match(item.material, f.material) && match(item.originCountry, f.origin),
    );
}

function ShopSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card border-border/60 h-44 animate-pulse rounded-2xl border" />
            ))}
        </div>
    );
}

function ShopError({ online, onRetry }: { online: boolean; onRetry: () => void }) {
    return (
        <div className="mt-12 flex flex-col items-center gap-3 px-8 text-center">
            <p className="text-muted-foreground text-sm">
                {online
                    ? 'Le catalogue n’a pas pu être chargé.'
                    : 'Vous êtes hors-ligne — le catalogue nécessite une connexion.'}
            </p>
            {online ? (
                <button
                    type="button"
                    onClick={onRetry}
                    className="text-foreground text-xs font-semibold underline-offset-4 hover:underline"
                >
                    Réessayer
                </button>
            ) : null}
        </div>
    );
}

function ShopEmpty() {
    return <p className="text-muted-foreground mt-8 text-center text-xs">Aucune pièce ne correspond à ces filtres.</p>;
}
