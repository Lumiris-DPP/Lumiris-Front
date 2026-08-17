'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shirt, BadgeCheck } from 'lucide-react';
import { IrisGrade } from '@lumiris/scoring-ui';
import { cn } from '@lumiris/ui/lib/cn';
import { routes } from '@/lib/routes';
import { formatCents, preparationLabel, type MarketplaceItem } from '@/lib/marketplace';
import { FavoriteButton } from './favorite-button';

interface BoutiqueCardProps {
    item: MarketplaceItem;
    index: number;
}

// Lien étalé plutôt que carte enveloppée dans un <a> : le bouton favori doit rester un frère du
// lien (un <button> dans un <a> est du HTML invalide) tout en se posant sur l'image.
export function BoutiqueCard({ item, index }: BoutiqueCardProps) {
    const grade = item.irisGrade;
    const isE = grade === 'E';
    const lowStock = item.stock <= 2;
    const prepLabel = preparationLabel(item.preparationDays);

    return (
        <motion.div
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-colors',
                'opal-shadow border-border/60 hover:border-border',
            )}
            style={isE ? { filter: 'saturate(0.4) brightness(0.94)' } : undefined}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 + index * 0.03 }}
        >
            <div className="relative flex h-32 w-full items-center justify-center bg-muted">
                {item.photoUrl ? (
                    <Image
                        src={item.photoUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 448px) 50vw, 224px"
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <Shirt className="h-10 w-10 text-muted-foreground/25" strokeWidth={1.5} aria-hidden />
                )}
                {grade ? (
                    <span className="absolute right-2 bottom-2">
                        <IrisGrade grade={grade} size="sm" tone="solid" />
                    </span>
                ) : null}
                <span
                    className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-card/95 px-1.5 py-0.5 text-[9px] font-semibold text-primary backdrop-blur-sm"
                    title="Passeport Lumiris vérifié"
                >
                    <BadgeCheck className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                    DPP vérifié
                </span>
                <FavoriteButton item={item} className="absolute top-2 right-2 z-20 h-7 w-7" />
            </div>

            <div className="flex flex-1 flex-col justify-center p-3">
                <h3 className="truncate text-xs leading-tight font-semibold text-foreground">{item.name}</h3>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.artisanName}</p>
                {prepLabel ? <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{prepLabel}</p> : null}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="font-mono text-sm font-semibold text-foreground">{formatCents(item.priceCents)}</p>
                    {lowStock ? (
                        <span className="text-[10px] font-medium text-lumiris-amber">
                            {item.stock === 0 ? 'Épuisé' : `Plus que ${item.stock}`}
                        </span>
                    ) : null}
                </div>
            </div>

            <Link href={routes.product(item.id)} prefetch aria-label={item.name} className="absolute inset-0 z-10" />
        </motion.div>
    );
}
