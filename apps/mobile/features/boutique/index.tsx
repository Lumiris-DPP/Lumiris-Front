'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, PackageOpen, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { getMarketplaceItems, useCartCount, type MarketplaceItem } from '@/lib/marketplace';
import { BoutiqueCard } from './card';
import {
    BoutiqueFilters,
    EMPTY_BOUTIQUE_FILTERS,
    applyBoutiqueFilters,
    fiberOptionsOf,
    priceBoundsOf,
    type BoutiqueFiltersState,
} from './filters';

export function Boutique() {
    const [now] = useState(() => new Date());
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<BoutiqueFiltersState>(EMPTY_BOUTIQUE_FILTERS);

    useEffect(() => {
        const timer = window.setTimeout(() => setLoading(false), 450);
        return () => window.clearTimeout(timer);
    }, []);

    // Catalogue trié (sans les filtres facette) — sert de référence pour les bornes/options.
    const sorted = useMemo<readonly MarketplaceItem[]>(
        () => getMarketplaceItems(now, filters.sort),
        [now, filters.sort],
    );
    const priceBounds = useMemo(() => priceBoundsOf(sorted), [sorted]);
    const fiberOptions = useMemo(() => fiberOptionsOf(sorted), [sorted]);

    const items = useMemo<readonly MarketplaceItem[]>(() => applyBoutiqueFilters(sorted, filters), [sorted, filters]);

    const [hero, ...rest] = items;
    const cartCount = useCartCount();

    return (
        <div className="bg-background flex h-full flex-col">
            <motion.header className="px-5 pb-3 pt-12" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Store className="text-primary h-5 w-5" strokeWidth={1.5} aria-hidden />
                        <h1 className="text-foreground text-xl font-bold tracking-tight">Boutique</h1>
                    </div>
                    <Link
                        href="/panier"
                        aria-label={`Panier${cartCount > 0 ? `, ${cartCount} article${cartCount > 1 ? 's' : ''}` : ''}`}
                        className="border-border bg-card text-foreground relative inline-flex h-9 w-9 items-center justify-center rounded-full border"
                    >
                        <ShoppingBag className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        {cartCount > 0 ? (
                            <span className="bg-lumiris-cyan text-background absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums">
                                {cartCount > 9 ? '9+' : cartCount}
                            </span>
                        ) : null}
                    </Link>
                </div>
                <p className="text-muted-foreground mt-0.5 text-pretty text-sm">
                    Pièces d&apos;artisans au passeport vérifié, achetables sans quitter l&apos;app.
                </p>
            </motion.header>

            <BoutiqueFilters
                state={filters}
                onChange={setFilters}
                resultCount={items.length}
                priceBounds={priceBounds}
                fiberOptions={fiberOptions}
            />

            <div className="flex-1 overflow-y-auto px-5 pb-28">
                {loading ? (
                    <BoutiqueSkeleton />
                ) : items.length === 0 ? (
                    <BoutiqueEmpty />
                ) : (
                    <div className="flex flex-col gap-3">
                        {hero ? <BoutiqueCard item={hero} index={0} featured /> : null}
                        <div className="grid grid-cols-2 gap-3">
                            {rest.map((item, idx) => (
                                <BoutiqueCard key={item.passport.id} item={item} index={idx + 1} />
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

function BoutiqueEmpty() {
    return (
        <div className="border-border/60 bg-card/60 mt-10 flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
            <span
                aria-hidden
                className="border-border/60 bg-background flex h-12 w-12 items-center justify-center rounded-full border"
            >
                <PackageOpen className="text-muted-foreground h-5 w-5" strokeWidth={1.5} />
            </span>
            <p className="text-foreground text-sm font-semibold">Aucune pièce ne correspond</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
                Ajuste les filtres pour découvrir d&apos;autres pièces d&apos;artisans en vente.
            </p>
        </div>
    );
}
