'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shirt, Sparkles } from 'lucide-react';
import { gradeBackgroundSolid } from '@lumiris/scoring-ui';
import { cn } from '@lumiris/ui/lib/cn';
import type { ShopItem } from '@/lib/shop';

interface ShopCardProps {
    item: ShopItem;
    index: number;
}

export function ShopCard({ item, index }: ShopCardProps) {
    const { passport, score, artisanName, isFeatured } = item;
    const grade = score.grade;
    const isE = grade === 'E';
    const isA = grade === 'A';
    const cardStyle: React.CSSProperties = {
        ...(isE ? { filter: 'saturate(0.4) brightness(0.92)' } : {}),
        ...(isA ? { animation: 'iris-grade-a-glow 3s ease-in-out infinite' } : {}),
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.03 }}
        >
            <Link
                href={`/passeport/${passport.id}`}
                className={cn(
                    'group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all',
                    'border-border/60 hover:border-border',
                )}
                style={cardStyle}
            >
                <div className="relative flex h-28 items-center justify-center bg-secondary/50">
                    <Shirt className="h-9 w-9 text-muted-foreground/25" aria-hidden />
                    <div
                        className={cn(
                            'absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground',
                            gradeBackgroundSolid(grade),
                        )}
                        aria-label={`Iris grade ${grade}`}
                    >
                        {grade}
                    </div>
                    {isFeatured ? (
                        <span
                            className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full border border-lumiris-cyan/30 bg-card/95 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-lumiris-cyan backdrop-blur-sm"
                            title="Atelier mis en avant"
                        >
                            <Sparkles className="h-2.5 w-2.5" />
                            Atelier+
                        </span>
                    ) : null}
                </div>

                <div className="p-3">
                    <h4 className="truncate text-xs leading-tight font-semibold text-foreground">
                        {passport.garment.reference}
                    </h4>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{artisanName}</p>
                    <p className="mt-1 text-xs font-bold text-foreground">
                        {passport.garment.retailPrice}{' '}
                        {passport.garment.currency === 'EUR' ? '€' : passport.garment.currency}
                    </p>
                </div>
            </Link>
        </motion.div>
    );
}
