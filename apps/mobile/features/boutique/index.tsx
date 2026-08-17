'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, PackageOpen, ShoppingBag, WifiOff } from 'lucide-react';
import { useMarketplaceSearch } from '@lumiris/api-client/react';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { toMarketplaceItem, useCartCount, type MarketplaceItem } from '@/lib/marketplace';
import { BoutiqueCard } from './card';
import {
    BoutiqueFilters,
    EMPTY_BOUTIQUE_FILTERS,
    applyBoutiqueFilters,
    categoryOptionsOf,
    materialOptionsOf,
    priceBoundsOf,
    type BoutiqueFiltersState,
} from './filters';

export function Boutique() {
    const [filters, setFilters] = useState<BoutiqueFiltersState>(EMPTY_BOUTIQUE_FILTERS);
    const query = filters.q.trim();

    // Deux requêtes, et c'est délibéré : les facettes et les bornes de prix dérivent du catalogue
    // ENTIER. Les faire dériver du résultat textuel ferait disparaître les puces à mesure qu'on tape
    // et sauter les bornes du curseur sous le doigt, avec une sélection de prix devenue hors bornes.
    // Le spread conditionnel garde la MÊME clé TanStack quand la recherche est vide : une requête.
    const catalogue = useMarketplaceSearch({ sort: filters.sort });
    const results = useMarketplaceSearch(
        { sort: filters.sort, ...(query ? { q: query } : {}) },
        { placeholderData: (previous) => previous },
    );
    const isLoading = results.isLoading;
    const isError = results.isError;

    // Seules les pièces réellement en vente in-app (inAppSale) apparaissent en Boutique.
    const sellable = useMemo(() => (results.data?.items ?? []).filter((p) => p.inAppSale !== false), [results.data]);
    const sorted = useMemo<readonly MarketplaceItem[]>(() => sellable.map(toMarketplaceItem), [sellable]);
    const facetSource = useMemo<readonly MarketplaceItem[]>(
        () => (catalogue.data?.items ?? []).filter((p) => p.inAppSale !== false).map(toMarketplaceItem),
        [catalogue.data],
    );
    const priceBounds = useMemo(() => priceBoundsOf(facetSource), [facetSource]);
    const categoryOptions = useMemo(() => categoryOptionsOf(facetSource), [facetSource]);
    const materialOptions = useMemo(() => materialOptionsOf(facetSource), [facetSource]);

    const items = useMemo<readonly MarketplaceItem[]>(() => applyBoutiqueFilters(sorted, filters), [sorted, filters]);

    const cartCount = useCartCount();

    return (
        <div className="flex h-full flex-col bg-background">
            <motion.header className="px-5 pt-12 pb-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden />
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Boutique</h1>
                    </div>
                    <Link
                        href="/panier"
                        aria-label={`Panier${cartCount > 0 ? `, ${cartCount} article${cartCount > 1 ? 's' : ''}` : ''}`}
                        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
                    >
                        <ShoppingBag className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        {cartCount > 0 ? (
                            <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-lumiris-cyan px-1 text-[9px] font-bold text-background tabular-nums">
                                {cartCount > 9 ? '9+' : cartCount}
                            </span>
                        ) : null}
                    </Link>
                </div>
                <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
                    Pièces d&apos;artisans au passeport vérifié, achetables sans quitter l&apos;app.
                </p>
            </motion.header>

            <BoutiqueFilters
                state={filters}
                onChange={setFilters}
                resultCount={items.length}
                priceBounds={priceBounds}
                categoryOptions={categoryOptions}
                materialOptions={materialOptions}
            />

            <div className="flex-1 overflow-y-auto px-5 pb-28">
                {isLoading ? (
                    <BoutiqueSkeleton />
                ) : isError ? (
                    <BoutiqueError />
                ) : items.length === 0 ? (
                    query ? (
                        <BoutiqueEmpty
                            title={`Aucune pièce pour « ${query} »`}
                            body="Essaie un mot plus simple — « veste », « lin », ou le nom d'une matière."
                            action={{
                                label: 'Effacer la recherche',
                                onClick: () => setFilters({ ...filters, q: '' }),
                            }}
                        />
                    ) : (
                        <BoutiqueEmpty
                            title="Aucune pièce ne correspond"
                            body="Ajuste les filtres pour découvrir d'autres pièces d'artisans en vente."
                        />
                    )
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {items.map((item, idx) => (
                            <BoutiqueCard key={item.id} item={item} index={idx} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function BoutiqueSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
        </div>
    );
}

function BoutiqueError() {
    return (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
            <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background"
            >
                <WifiOff className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </span>
            <p className="text-sm font-semibold text-foreground">Boutique indisponible</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
                Impossible de charger le catalogue pour le moment. Réessaie dans un instant.
            </p>
        </div>
    );
}

function BoutiqueEmpty({
    title,
    body,
    action,
}: {
    title: string;
    body: string;
    action?: { label: string; onClick: () => void };
}) {
    return (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
            <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background"
            >
                <PackageOpen className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </span>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
            {action ? (
                <button
                    type="button"
                    onClick={action.onClick}
                    className="mt-1 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground"
                >
                    {action.label}
                </button>
            ) : null}
        </div>
    );
}
