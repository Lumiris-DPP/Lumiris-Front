import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { JOURNAL_CATEGORY_LABEL } from '@lumiris/types';
import { cn } from '@lumiris/ui/lib/cn';
import { GRADE_CONFIG } from '@/lib/iris/grade-config';
import type { DiscoverFeedItem } from '@/lib/discover/feed';
import { CoverImage } from './cover-image';

type Layout = 'horizontal' | 'vertical';

interface ArticleCardProps {
    item: DiscoverFeedItem;
    index: number;
    layout?: Layout;
}

export function ArticleCard({ item, index, layout = 'horizontal' }: ArticleCardProps) {
    const prefersReduced = useReducedMotion();
    const isE = item.grade === 'E';

    const widthClass = layout === 'horizontal' ? 'w-[62vw] max-w-[18rem] shrink-0' : 'w-full';

    return (
        <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.03 * index }}
            className={widthClass}
            style={isE ? { filter: 'saturate(0.4)' } : undefined}
        >
            <Link
                to={`/journal/${item.slug}`}
                aria-label={`${item.title} - ${JOURNAL_CATEGORY_LABEL[item.category]} - grade ${item.grade}`}
                className="group block"
            >
                <motion.article
                    whileTap={prefersReduced ? undefined : { scale: 0.98 }}
                    className="flex flex-col gap-2.5"
                >
                    <div className="border-border/40 bg-card/60 relative aspect-square overflow-hidden rounded-2xl border">
                        <CoverImage
                            src={item.coverImage}
                            alt={item.title}
                            category={item.category}
                            grade={item.grade}
                            sizes="(max-width: 480px) 62vw, 18rem"
                        />
                        <span
                            aria-label={`Grade ${item.grade}`}
                            className={cn(
                                'text-primary-foreground absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md font-mono text-[11px] font-bold shadow-md',
                                GRADE_CONFIG[item.grade].bgClass,
                            )}
                        >
                            {item.grade}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-foreground line-clamp-2 text-sm font-semibold leading-snug">
                            {item.title}
                        </h3>
                        <p className="text-muted-foreground text-[11px]">
                            {item.author} · {item.readTime}
                        </p>
                    </div>
                </motion.article>
            </Link>
        </motion.div>
    );
}
