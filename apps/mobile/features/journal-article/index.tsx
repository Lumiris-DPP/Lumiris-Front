import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Clock } from 'lucide-react';
import { JOURNAL_CATEGORY_LABEL } from '@lumiris/types';
import type { JournalArticlePublic } from '@lumiris/mock-data';
import { Badge } from '@lumiris/ui/components/badge';
import { Button } from '@lumiris/ui/components/button';
import { cn } from '@lumiris/ui/lib/cn';
import { formatDate } from '@lumiris/utils';
import { GlassCard } from '@/lib/motion';
import { GRADE_CONFIG } from '@/lib/iris/grade-config';
import { gradeForCategory } from '@/lib/discover/feed';

export interface JournalArticleProps {
    article: JournalArticlePublic;
}

export function JournalArticle({ article }: JournalArticleProps) {
    const grade = gradeForCategory(article.category);
    const paragraphs = article.body
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

    return (
        <div className="relative flex h-full flex-col overflow-y-auto bg-background pb-28">
            <div className="sticky top-0 z-30 flex px-3 pt-3">
                <Button asChild variant="outline" size="icon" className="rounded-full bg-card/90 backdrop-blur-md">
                    <Link href="/discover" aria-label="Retour à Découvrir">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <article className="mt-4 flex flex-col gap-5 px-5">
                {article.coverImage ? (
                    <div className="relative aspect-video overflow-hidden rounded-2xl">
                        <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            sizes="(max-width: 480px) 100vw, 480px"
                            loading="lazy"
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div
                        aria-hidden
                        className="aspect-video rounded-2xl opacity-30"
                        style={{
                            background:
                                'linear-gradient(135deg, var(--lumiris-iris), var(--lumiris-cyan), var(--lumiris-amber))',
                        }}
                    />
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                        aria-label={`Grade ${grade}`}
                        className={cn(
                            'h-6 min-w-6 rounded-md px-1.5 font-mono font-bold text-primary-foreground',
                            GRADE_CONFIG[grade].bgClass,
                        )}
                    >
                        {grade}
                    </Badge>
                    <Badge variant="outline" className="rounded-full text-muted-foreground">
                        {JOURNAL_CATEGORY_LABEL[article.category]}
                    </Badge>
                    <span className="text-muted-foreground">{formatDate(article.updatedAt, { locale: 'fr-FR' })}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                    </span>
                </div>

                <h1 className="text-2xl leading-tight font-bold tracking-tight text-foreground">{article.title}</h1>

                <p className="text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>

                <div className="prose prose-sm dark:prose-invert flex max-w-none flex-col gap-4">
                    {paragraphs.map((p, i) => (
                        <p key={i} className="text-sm leading-relaxed text-foreground/90">
                            {p}
                        </p>
                    ))}
                </div>

                {article.author ? (
                    <GlassCard intensity="subtle" className="mt-4 rounded-2xl p-4">
                        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Auteur
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{article.author}</p>
                    </GlassCard>
                ) : null}
            </article>
        </div>
    );
}
