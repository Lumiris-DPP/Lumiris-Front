'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { JournalCategory } from '@lumiris/types';
import { Tabs, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { cn } from '@lumiris/ui/lib/cn';
import { GRADE_CONFIG } from '@/lib/iris/grade-config';
import { useUser } from '@/lib/auth';
import { getDiscoverFeed, JOURNAL_CATEGORIES_ORDERED, type DiscoverFeedItem } from '@/lib/discover/feed';
import { CategoryChips, type CategoryFilter } from './category-chips';
import { HeroCard } from './hero-card';
import { CategoryRow } from './category-row';
import { ArticleCard } from './article-card';

const WEB_BASE_URL = 'https://lumiris.fr';
const COMPACT_SCROLL_THRESHOLD = 60;

export interface DiscoverProps {
    items?: readonly DiscoverFeedItem[];
}

export function Discover({ items }: DiscoverProps = {}) {
    const feed = useMemo(() => items ?? getDiscoverFeed(), [items]);
    const router = useRouter();
    const { isAuthenticated } = useUser();

    const [filter, setFilter] = useState<CategoryFilter>('all');
    const [compact, setCompact] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const node = scrollRef.current;
        if (!node) return undefined;
        const onScroll = () => setCompact(node.scrollTop > COMPACT_SCROLL_THRESHOLD);
        node.addEventListener('scroll', onScroll, { passive: true });
        return () => node.removeEventListener('scroll', onScroll);
    }, []);

    const availableCategories = useMemo(() => {
        const set = new Set<JournalCategory>();
        for (const item of feed) set.add(item.category);
        return JOURNAL_CATEGORIES_ORDERED.filter((c) => set.has(c));
    }, [feed]);

    return (
        <div className="bg-background flex h-full flex-col">
            <motion.header className="px-5 pb-3 pt-12" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2">
                    <h1 className="text-foreground text-2xl font-bold tracking-tight">Découvrir</h1>
                    <Sparkles className={cn('h-4 w-4', GRADE_CONFIG.C.cssClass)} />
                </div>
                <p className="text-muted-foreground mt-0.5 text-sm">Le Journal LUMIRIS</p>

                {isAuthenticated ? (
                    <Tabs
                        value="all"
                        onValueChange={(value) => {
                            if (value === 'for-you') router.push('/discover/for-you');
                        }}
                        className="mt-4"
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="all">Tous</TabsTrigger>
                            <TabsTrigger value="for-you">Pour toi</TabsTrigger>
                        </TabsList>
                    </Tabs>
                ) : null}
            </motion.header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-28">
                <CategoryChips
                    sticky
                    compact={compact}
                    categories={availableCategories}
                    value={filter}
                    onChange={setFilter}
                />

                {feed.length === 0 ? (
                    <EmptyState />
                ) : filter === 'all' ? (
                    <AllView feed={feed} />
                ) : (
                    <FilteredView items={feed.filter((it) => it.category === filter)} />
                )}

                <FooterCta />
            </div>
        </div>
    );
}

function AllView({ feed }: { feed: readonly DiscoverFeedItem[] }) {
    const grouped = useMemo(() => groupByCategory(feed.slice(1)), [feed]);
    const hero = feed[0];
    if (!hero) return <EmptyState />;

    let runningIndex = 1;
    const sections = JOURNAL_CATEGORIES_ORDERED.map((cat) => {
        const list = grouped[cat];
        if (!list || list.length === 0) return null;
        const baseIndex = runningIndex;
        runningIndex += list.length;
        return <CategoryRow key={cat} category={cat} items={list} baseIndex={baseIndex} />;
    });

    return (
        <div className="mt-4">
            <HeroCard item={hero} delay={0.05} />
            {sections}
        </div>
    );
}

function FilteredView({ items }: { items: readonly DiscoverFeedItem[] }) {
    if (items.length === 0) {
        return (
            <p className="text-muted-foreground mt-12 px-2 text-center text-xs">
                Pas encore d&apos;article dans cette catégorie.
            </p>
        );
    }

    const [hero, ...rest] = items;
    if (!hero) return null;

    return (
        <div className="mt-4 flex flex-col gap-5">
            <HeroCard item={hero} delay={0.05} />
            {rest.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {rest.map((item, i) => (
                        <ArticleCard key={item.slug} item={item} index={i + 1} layout="vertical" />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function groupByCategory(items: readonly DiscoverFeedItem[]): Partial<Record<JournalCategory, DiscoverFeedItem[]>> {
    const out: Partial<Record<JournalCategory, DiscoverFeedItem[]>> = {};
    for (const item of items) {
        const list = out[item.category] ?? [];
        list.push(item);
        out[item.category] = list;
    }
    return out;
}

function EmptyState() {
    return (
        <div className="mt-12 flex flex-col items-center gap-3 px-8 text-center">
            <Sparkles className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-sm">Pas encore d&apos;articles. Reviens bientôt.</p>
        </div>
    );
}

function FooterCta() {
    return (
        <div className="mt-10 flex items-center justify-center pb-2">
            <a
                href={`${WEB_BASE_URL}/journal`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
            >
                Plus d&apos;histoires sur lumiris.fr/journal
            </a>
        </div>
    );
}
