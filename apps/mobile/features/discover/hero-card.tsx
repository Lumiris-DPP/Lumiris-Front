'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { JOURNAL_CATEGORY_LABEL } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { GRADE_CONFIG } from '@/lib/iris/grade-config';
import type { DiscoverFeedItem } from '@/lib/discover/feed';
import { CoverImage } from './cover-image';

interface HeroCardProps {
    item: DiscoverFeedItem;
    delay?: number;
}

export function HeroCard({ item, delay = 0 }: HeroCardProps) {
    const prefersReduced = useReducedMotion();
    const isE = item.grade === 'E';

    return (
        <motion.div
            initial={prefersReduced ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut', delay }}
            style={isE ? { filter: 'saturate(0.4)' } : undefined}
        >
            <Link
                href={`/journal/${item.slug}`}
                aria-label={`${item.title} - ${JOURNAL_CATEGORY_LABEL[item.category]} - grade ${item.grade}`}
                className="group block"
            >
                <motion.article
                    whileTap={prefersReduced ? undefined : { scale: 0.98 }}
                    className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border/40 bg-card/60 shadow-lg backdrop-blur-md"
                >
                    <CoverImage
                        src={item.coverImage}
                        alt={item.title}
                        category={item.category}
                        grade={item.grade}
                        sizes="(max-width: 480px) 100vw, 480px"
                        priority
                    />

                    <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
                    />

                    <span className="absolute top-3 left-3 inline-flex items-center rounded-full border border-border/40 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-md">
                        {JOURNAL_CATEGORY_LABEL[item.category]}
                    </span>

                    <span
                        aria-label={`Grade ${item.grade}`}
                        className={cn(
                            'absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold text-primary-foreground shadow-md',
                            GRADE_CONFIG[item.grade].bgClass,
                        )}
                    >
                        {item.grade}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 text-white">
                        <h2 className="line-clamp-3 text-lg leading-tight font-bold tracking-tight">{item.title}</h2>
                        <div className="flex items-center gap-3 text-[11px] text-white/80">
                            <span className="line-clamp-1">{item.author}</span>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.readTime}
                            </span>
                        </div>
                    </div>
                </motion.article>
            </Link>
        </motion.div>
    );
}
