'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Shirt, BadgeCheck } from 'lucide-react';
import { IrisGrade } from '@lumiris/scoring-ui';
import { cn } from '@lumiris/ui/lib/cn';
import { routes } from '@/lib/routes';
import { formatCents, type MarketplaceItem } from '@/lib/marketplace';

interface BoutiqueCardProps {
    item: MarketplaceItem;
    index: number;
    featured?: boolean;
}

export function BoutiqueCard({ item, index, featured = false }: BoutiqueCardProps) {
    const grade = item.irisGrade;
    const isE = grade === 'E';
    const lowStock = item.stock <= 2;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 + index * 0.03 }}
        >
            <Link
                href={routes.product(item.id)}
                prefetch
                className={cn(
                    'group relative flex overflow-hidden rounded-2xl border bg-card text-left transition-colors',
                    'opal-shadow border-border/60 hover:border-border',
                    featured ? 'flex-row' : 'flex-col',
                )}
                style={isE ? { filter: 'saturate(0.4) brightness(0.94)' } : undefined}
            >
                <div
                    className={cn(
                        'relative flex items-center justify-center bg-muted',
                        featured ? 'h-32 w-32 shrink-0' : 'h-32 w-full',
                    )}
                >
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
                        <span className="absolute top-2 right-2">
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
                </div>

                <div className="flex flex-1 flex-col justify-center p-3">
                    <h3
                        className={cn(
                            'truncate leading-tight font-semibold text-foreground',
                            featured ? 'text-sm' : 'text-xs',
                        )}
                    >
                        {item.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.artisanName}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                        <p className="font-mono text-sm font-semibold text-foreground">
                            {formatCents(item.priceCents)}
                        </p>
                        {lowStock ? (
                            <span className="text-[10px] font-medium text-lumiris-amber">
                                {item.stock === 0 ? 'Épuisé' : `Plus que ${item.stock}`}
                            </span>
                        ) : null}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
