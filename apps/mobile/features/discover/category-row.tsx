'use client';

import { type JournalCategory, JOURNAL_CATEGORY_LABEL } from '@lumiris/types';
import type { DiscoverFeedItem } from '@/lib/discover/feed';
import { ArticleCard } from './article-card';

interface CategoryRowProps {
    category: JournalCategory;
    items: readonly DiscoverFeedItem[];
    baseIndex?: number;
}

export function CategoryRow({ category, items, baseIndex = 0 }: CategoryRowProps) {
    if (items.length === 0) return null;

    const headingId = `discover-section-${category}`;
    const compact = items.length <= 2;
    const label = JOURNAL_CATEGORY_LABEL[category];

    return (
        <section aria-labelledby={headingId} className="mt-8">
            <div className="mb-3 flex items-baseline justify-between px-1">
                <h2 id={headingId} className="text-foreground text-base font-semibold tracking-tight">
                    {label}
                </h2>
                <span className="text-muted-foreground text-[11px]">
                    {items.length} {items.length === 1 ? 'article' : 'articles'}
                </span>
            </div>

            {compact ? (
                <div className="flex flex-col gap-4">
                    {items.map((item, i) => (
                        <ArticleCard key={item.slug} item={item} index={baseIndex + i} layout="vertical" />
                    ))}
                </div>
            ) : (
                <div
                    className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {items.map((item, i) => (
                        <div key={item.slug} style={{ scrollSnapAlign: 'start' }}>
                            <ArticleCard item={item} index={baseIndex + i} layout="horizontal" />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
