import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { JOURNAL_CATEGORY_LABEL } from '@lumiris/types';
import type { Article } from '@/lib/journal';

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

interface Props {
    article: Article;
    related: readonly Article[];
}

export function JournalArticleView({ article, related }: Props) {
    const Body = article.Component;
    const date = DATE_FMT.format(new Date(article.publishedAt));

    return (
        <article className="pt-28 pb-20">
            <header className="mx-auto max-w-3xl px-6">
                <Link
                    href="/journal"
                    className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
                >
                    ← Tous les articles
                </Link>
                <p className="mt-6 text-xs font-medium tracking-[0.25em] text-muted-foreground uppercase">
                    {JOURNAL_CATEGORY_LABEL[article.category]}
                </p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl">
                    {article.title}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">{article.excerpt}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>par {article.author}</span>
                    <span aria-hidden>·</span>
                    <span className="font-mono">{date}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readingTime} min
                    </span>
                </div>
            </header>

            {article.coverImage ? (
                <figure className="mx-auto mt-10 max-w-4xl px-6">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-muted">
                        <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 1024px"
                            className="object-cover"
                            priority
                        />
                    </div>
                </figure>
            ) : null}

            <section className="mx-auto mt-10 max-w-3xl px-6">
                <Body />
            </section>

            {related.length > 0 ? (
                <section
                    aria-labelledby="journal-related-title"
                    className="mx-auto mt-16 max-w-5xl border-t border-border px-6 pt-10"
                >
                    <h2
                        id="journal-related-title"
                        className="mb-6 text-2xl font-semibold tracking-tight text-foreground"
                    >
                        À lire aussi
                    </h2>
                    <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        {related.map((a) => (
                            <li key={a.slug}>
                                <Link
                                    href={`/journal/${a.slug}`}
                                    className="hover:border-grade-a/40 group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <p className="font-mono text-[11px] text-muted-foreground">
                                        {DATE_FMT.format(new Date(a.publishedAt))}
                                    </p>
                                    <h3 className="group-hover:text-grade-a mt-2 text-base leading-snug font-semibold text-foreground transition-colors">
                                        {a.title}
                                    </h3>
                                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                        {a.excerpt}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <p className="mx-auto mt-16 max-w-3xl px-6 text-xs text-muted-foreground">
                Article publié sous la{' '}
                <Link href="/charte-independance" className="text-foreground underline-offset-4 hover:underline">
                    charte d’indépendance LUMIRIS
                </Link>
                . Aucun acteur n’achète ses scores ni ses placements éditoriaux.
            </p>
        </article>
    );
}
