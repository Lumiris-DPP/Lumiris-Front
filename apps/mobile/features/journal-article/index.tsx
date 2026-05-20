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
        <div className="bg-background relative flex h-full flex-col overflow-y-auto pb-28">
            <div className="sticky top-0 z-30 flex px-3 pt-3">
                <Button asChild variant="outline" size="icon" className="bg-card/90 rounded-full backdrop-blur-md">
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
                                'linear-gradient(135deg, var(--lumiris-emerald), var(--lumiris-cyan), var(--lumiris-amber))',
                        }}
                    />
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                        aria-label={`Grade ${grade}`}
                        className={cn(
                            'text-primary-foreground h-6 min-w-6 rounded-md px-1.5 font-mono font-bold',
                            GRADE_CONFIG[grade].bgClass,
                        )}
                    >
                        {grade}
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground rounded-full">
                        {JOURNAL_CATEGORY_LABEL[article.category]}
                    </Badge>
                    <span className="text-muted-foreground">{formatDate(article.updatedAt, { locale: 'fr-FR' })}</span>
                    <span className="text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                    </span>
                </div>

                <h1 className="text-foreground text-2xl font-bold leading-tight tracking-tight">{article.title}</h1>

                <p className="text-muted-foreground text-lg leading-relaxed">{article.excerpt}</p>

                <div className="prose prose-sm dark:prose-invert flex max-w-none flex-col gap-4">
                    {paragraphs.map((p, i) => (
                        <p key={i} className="text-foreground/90 text-sm leading-relaxed">
                            {p}
                        </p>
                    ))}
                </div>

                {article.author ? (
                    <GlassCard intensity="subtle" className="mt-4 rounded-2xl p-4">
                        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                            Auteur
                        </p>
                        <p className="text-foreground mt-1 text-sm font-semibold">{article.author}</p>
                    </GlassCard>
                ) : null}
            </article>
        </div>
    );
}

export function JournalArticleNotFound() {
    return (
        <div className="bg-background flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-foreground text-lg font-semibold">Article introuvable</p>
            <p className="text-muted-foreground text-sm">Cet article n&apos;existe pas ou a été retiré du Journal.</p>
            <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/discover">
                    <ChevronLeft className="h-4 w-4" />
                    Retour à Découvrir
                </Link>
            </Button>
        </div>
    );
}
