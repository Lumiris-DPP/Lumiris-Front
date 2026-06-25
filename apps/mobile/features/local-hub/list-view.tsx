'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MapPinOff } from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@lumiris/ui/components/empty';
import type { LocalPoint } from './types';
import { ListSkeleton } from './list-skeleton';
import { MarketplaceBanner } from './marketplace-banner';
import { PointCard } from './point-card';

interface ListViewProps {
    points: readonly LocalPoint[];
    loading: boolean;
    showMarketplaceBanner: boolean;
}

export function ListView({ points, loading, showMarketplaceBanner }: ListViewProps) {
    const prefersReduced = useReducedMotion();

    return (
        <div className="flex flex-col gap-4 px-4 pb-24 pt-3">
            <AnimatePresence initial={false}>
                {showMarketplaceBanner && !loading ? (
                    <motion.div
                        key="marketplace-banner"
                        initial={prefersReduced ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <MarketplaceBanner />
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {loading ? (
                <ListSkeleton />
            ) : points.length === 0 ? (
                <Empty className="mt-8 border-0">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <MapPinOff className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                        </EmptyMedia>
                        <EmptyTitle>Aucun résultat près de toi</EmptyTitle>
                        <EmptyDescription>
                            Élargis la distance ou retire des filtres pour voir plus de partenaires.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <ul className="flex flex-col gap-4">
                    {points.map((point, index) => (
                        <li key={`${point.kind}-${point.id}`}>
                            <PointCard point={point} index={index} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
