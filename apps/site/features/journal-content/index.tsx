'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import type { JournalCategory } from '@lumiris/types';
import { JOURNAL_CATEGORY_LABEL } from '@lumiris/types';
import { Tabs, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import type { ArticleMeta } from '@/lib/journal';

const CATEGORY_LABEL = JOURNAL_CATEGORY_LABEL;

const CATEGORY_TONE: Record<JournalCategory, string> = {
    reglementation: 'text-grade-a bg-grade-a/8 border-grade-a/15',
    'portrait-artisan': 'text-grade-d bg-grade-d/8 border-grade-d/15',
    'savoir-faire': 'text-grade-c bg-grade-c/8 border-grade-c/15',
    entretien: 'text-grade-b bg-grade-b/8 border-grade-b/15',
};

const PUBLIC_CATEGORIES: readonly JournalCategory[] = [
    'reglementation',
    'portrait-artisan',
    'savoir-faire',
    'entretien',
] as const;

type FilterValue = 'all' | JournalCategory;

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function CategoryBadge({ category }: { category: JournalCategory }) {
    return (
        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${CATEGORY_TONE[category]}`}>
            {CATEGORY_LABEL[category]}
        </span>
    );
}

function ArticleCard({ article, index, featured }: { article: ArticleMeta; index: number; featured?: boolean }) {
    const date = DATE_FMT.format(new Date(article.publishedAt));
    return (
        <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
        >
            <Link href={`/journal/${article.slug}`} className="flex h-full flex-col">
                {article.coverImage ? (
                    <div
                        className={`relative w-full overflow-hidden bg-muted ${featured ? 'aspect-16/8' : 'aspect-video'}`}
                    >
                        <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            sizes={featured ? '(max-width: 768px) 100vw, 1024px' : '(max-width: 768px) 100vw, 50vw'}
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                    </div>
                ) : null}
                <div className={`flex flex-1 flex-col p-6 ${featured ? 'sm:p-8' : ''}`}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <CategoryBadge category={article.category} />
                        <span className="font-mono text-[11px] text-muted-foreground">{date}</span>
                    </div>
                    <h3
                        className={`group-hover:text-grade-a leading-snug font-semibold text-balance text-foreground transition-colors ${featured ? 'text-2xl sm:text-3xl' : 'text-base'}`}
                    >
                        {article.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {article.excerpt}
                    </p>
                    <div className="mt-5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {article.readingTime} min
                        </span>
                        <span>par {article.author}</span>
                    </div>
                </div>
            </Link>
        </motion.article>
    );
}

interface Props {
    articles: readonly ArticleMeta[];
}

export function JournalContent({ articles }: Props) {
    const [filter, setFilter] = useState<FilterValue>('all');

    const visible = useMemo(
        () => (filter === 'all' ? articles : articles.filter((a) => a.category === filter)),
        [filter, articles],
    );

    const featured = visible[0];
    const rest = visible.slice(1);

    return (
        <div className="pt-28 pb-20">
            <header className="mx-auto mb-10 max-w-5xl px-6">
                <p className="mb-4 text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">Journal</p>
                <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
                    Le journal LUMIRIS
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">
                    Décryptages réglementaires (DPP, ESPR, AGEC), portraits d’artisans, savoir-faire et entretien des
                    pièces. Pour comprendre la filière textile française avant la loi.
                </p>
            </header>

            <section className="mx-auto mb-10 max-w-5xl px-6">
                <Tabs
                    value={filter}
                    onValueChange={(v) => setFilter(v as FilterValue)}
                    aria-label="Catégories du journal"
                >
                    <TabsList className="flex h-auto w-full flex-wrap justify-start">
                        <TabsTrigger value="all">Tous</TabsTrigger>
                        {PUBLIC_CATEGORIES.map((cat) => (
                            <TabsTrigger key={cat} value={cat}>
                                {CATEGORY_LABEL[cat]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </section>

            <section className="mx-auto max-w-5xl px-6">
                {visible.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                        Aucun article dans cette catégorie pour l’instant.
                    </p>
                ) : (
                    <>
                        {featured ? (
                            <div className="mb-8">
                                <ArticleCard article={featured} index={0} featured />
                            </div>
                        ) : null}
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {rest.map((article, i) => (
                                <ArticleCard key={article.slug} article={article} index={i + 1} />
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
