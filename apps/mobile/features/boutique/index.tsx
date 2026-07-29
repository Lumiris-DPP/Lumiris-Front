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

    // Catalogue public RÉEL, trié côté backend (le tri est neutre par défaut).
    const { data, isLoading, isError } = useMarketplaceSearch({ sort: filters.sort });

    // Seules les pièces réellement en vente in-app (inAppSale) apparaissent en Boutique.
    const sorted = useMemo<readonly MarketplaceItem[]>(
        () => (data?.items ?? []).filter((p) => p.inAppSale !== false).map(toMarketplaceItem),
        [data],
    );
    const priceBounds = useMemo(() => priceBoundsOf(sorted), [sorted]);
    const categoryOptions = useMemo(() => categoryOptionsOf(sorted), [sorted]);
    const materialOptions = useMemo(() => materialOptionsOf(sorted), [sorted]);

    const items = useMemo<readonly MarketplaceItem[]>(() => applyBoutiqueFilters(sorted, filters), [sorted, filters]);

    const [hero, ...rest] = items;
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
                    <BoutiqueEmpty />
                ) : (
                    <div className="flex flex-col gap-3">
                        {hero ? <BoutiqueCard item={hero} index={0} featured /> : null}
                        <div className="grid grid-cols-2 gap-3">
                            {rest.map((item, idx) => (
                                <BoutiqueCard key={item.id} item={item} index={idx + 1} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function BoutiqueSkeleton() {
    return (
        <div className="flex flex-col gap-3" aria-hidden>
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))}
            </div>
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

function BoutiqueEmpty() {
    return (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
            <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background"
            >
                <PackageOpen className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </span>
            <p className="text-sm font-semibold text-foreground">Aucune pièce ne correspond</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
                Ajuste les filtres pour découvrir d&apos;autres pièces d&apos;artisans en vente.
            </p>
        </div>
    );
}
