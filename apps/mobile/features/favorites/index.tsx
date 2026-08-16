'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { useFavorites } from '@lumiris/api-client/react';
import { Skeleton } from '@lumiris/ui/components/skeleton';
import { useUser } from '@/lib/auth/use-user';
import { toMarketplaceItem } from '@/lib/marketplace';
import { BoutiqueCard } from '@/features/boutique/card';

export function Favorites() {
    const { isAuthenticated } = useUser();
    const { data = [], isLoading } = useFavorites({ enabled: isAuthenticated });

    return (
        <div className="flex h-full flex-col overflow-y-auto bg-background pb-28">
            <motion.header className="px-5 pt-12 pb-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-lumiris-rose" strokeWidth={1.5} aria-hidden />
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Mes favoris</h1>
                </div>
                <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
                    Les pièces que tu gardes sous la main — on te prévient s&apos;il n&apos;en reste qu&apos;une ou si
                    leur prix baisse.
                </p>
            </motion.header>

            <div className="flex-1 px-5">
                {!isAuthenticated ? (
                    <EmptyPanel
                        title="Connecte-toi pour retrouver tes favoris"
                        body="Tes pièces mises de côté te suivent d’un appareil à l’autre."
                        href="/auth/sign-in?returnTo=%2Fme%2Ffavoris%2F"
                        cta="Se connecter"
                    />
                ) : isLoading ? (
                    <div className="grid grid-cols-2 gap-3" aria-hidden>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <EmptyPanel
                        title="Aucun favori pour l’instant"
                        body="Touche le cœur sur une pièce pour la retrouver ici — et être prévenu s’il n’en reste qu’une, ou si son prix baisse."
                        href="/boutique"
                        cta="Voir la Boutique"
                    />
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {data.map((dto, index) => (
                            <BoutiqueCard key={dto.id} item={toMarketplaceItem(dto)} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyPanel({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
    return (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
            <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background"
            >
                <Heart className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </span>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
            <Link
                href={href}
                className="mt-1 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
                <ShoppingBag className="h-4 w-4" />
                {cta}
            </Link>
        </div>
    );
}
