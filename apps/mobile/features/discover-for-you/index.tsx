import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Info, Sparkles } from 'lucide-react';
import type { JournalCategory } from '@lumiris/types';
import { useMarketplaceSearch } from '@lumiris/api-client/react';
import { GlassCard } from '@/lib/motion';
import { useUser } from '@/lib/auth';
import { toMarketplaceItem, type MarketplaceItem } from '@/lib/marketplace';
import { articlesForStyles } from '@/lib/discover/for-you';
import { articleToFeedItem, JOURNAL_CATEGORIES_ORDERED, type DiscoverFeedItem } from '@/lib/discover/feed';
import { BoutiqueCard } from '@/features/boutique/card';
import { HeroCard } from '@/features/discover/hero-card';
import { CategoryRow } from '@/features/discover/category-row';
import { CategoryChips, type CategoryFilter } from '@/features/discover/category-chips';
import { ArticleCard } from '@/features/discover/article-card';

const TOAST_DURATION_MS = 4000;
const MAX_PIECES = 6;

export function DiscoverForYou() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useUser();
    const [showStyleToast, setShowStyleToast] = useState(false);
    const [filter, setFilter] = useState<CategoryFilter>('all');

    // Pièces recommandées : catalogue public RÉEL (mêmes données que la Boutique), tri neutre,
    // curées sur les meilleurs scores Iris (A/B). Chaque carte mène à la fiche produit réelle
    // (/boutique/[id]) → surface de recommandation branchée sur le vrai parcours d'achat.
    const { data: marketplace, isLoading: piecesLoading } = useMarketplaceSearch();

    useEffect(() => {
        if (!isAuthenticated) navigate('/auth', { replace: true });
    }, [isAuthenticated, navigate]);

    const stylePrefs = useMemo(() => user?.stylePrefs ?? [], [user]);
    const stylePrefsEmpty = isAuthenticated && stylePrefs.length === 0;

    useEffect(() => {
        if (!stylePrefsEmpty) return undefined;
        setShowStyleToast(true);
        const t = window.setTimeout(() => setShowStyleToast(false), TOAST_DURATION_MS);
        return () => window.clearTimeout(t);
    }, [stylePrefsEmpty]);

    const articles = useMemo(() => articlesForStyles(stylePrefs), [stylePrefs]);
    const feed = useMemo(() => articles.map(articleToFeedItem), [articles]);

    const availableCategories = useMemo(() => {
        const set = new Set<JournalCategory>();
        for (const item of feed) set.add(item.category);
        return JOURNAL_CATEGORIES_ORDERED.filter((c) => set.has(c));
    }, [feed]);

    const filteredFeed = useMemo(
        () => (filter === 'all' ? feed : feed.filter((it) => it.category === filter)),
        [feed, filter],
    );

    const pieces = useMemo<readonly MarketplaceItem[]>(
        () =>
            (marketplace?.items ?? [])
                .filter((p) => p.inAppSale !== false)
                .map(toMarketplaceItem)
                .filter((it) => it.irisGrade === 'A' || it.irisGrade === 'B')
                .slice(0, MAX_PIECES),
        [marketplace],
    );

    const subtitle =
        stylePrefs.length > 0
            ? `Croisé avec ${stylePrefs.slice(0, 3).join(', ')}`
            : 'Une sélection d’articles et de pièces pour toi';

    if (!isAuthenticated) return null;

    return (
        <div className="bg-background flex h-full flex-col">
            <motion.header className="px-5 pb-3 pt-12" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <Link
                    to="/discover"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Découvrir
                </Link>
                <div className="mt-2 flex items-center gap-2">
                    <h1 className="text-foreground text-2xl font-bold tracking-tight">Pour toi</h1>
                    <Sparkles className="text-lumiris-cyan h-4 w-4" />
                </div>
                <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p>
            </motion.header>

            <AnimatePresence>
                {showStyleToast ? (
                    <motion.div
                        role="status"
                        aria-live="polite"
                        className="border-border/60 bg-card/95 text-foreground pointer-events-auto fixed left-1/2 top-24 z-50 flex w-fit max-w-[20rem] -translate-x-1/2 items-center gap-2 rounded-2xl border px-4 py-2 text-xs shadow-xl backdrop-blur-md"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Info className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                        <span>
                            Choisis ton style pour personnaliser{' '}
                            <Link
                                to="/onboarding/profile"
                                className="text-foreground font-semibold underline-offset-2 hover:underline"
                            >
                                renseigner
                            </Link>
                        </span>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto px-4 pb-28">
                <ArticlesSection
                    feed={filteredFeed}
                    allFeed={feed}
                    availableCategories={availableCategories}
                    filter={filter}
                    onFilterChange={setFilter}
                    stylePrefsEmpty={stylePrefsEmpty}
                />
                <PiecesSection pieces={pieces} isLoading={piecesLoading} />
            </div>
        </div>
    );
}

interface ArticlesSectionProps {
    feed: readonly DiscoverFeedItem[];
    allFeed: readonly DiscoverFeedItem[];
    availableCategories: readonly JournalCategory[];
    filter: CategoryFilter;
    onFilterChange: (next: CategoryFilter) => void;
    stylePrefsEmpty: boolean;
}

function ArticlesSection({
    feed,
    allFeed,
    availableCategories,
    filter,
    onFilterChange,
    stylePrefsEmpty,
}: ArticlesSectionProps) {
    return (
        <section className="mt-2">
            <h2 className="text-foreground px-1 text-base font-semibold tracking-tight">
                Articles qui matchent ton style
            </h2>

            {stylePrefsEmpty ? (
                <EmptyHint
                    text="Renseigne ton style pour voir des articles adaptés."
                    href="/onboarding/profile"
                    cta="Choisir mon style"
                />
            ) : allFeed.length === 0 ? (
                <p className="text-muted-foreground mt-3 px-1 text-xs">
                    Pas d&apos;article pour ces préférences pour le moment.
                </p>
            ) : (
                <>
                    {availableCategories.length > 1 ? (
                        <div className="mt-3">
                            <CategoryChips categories={availableCategories} value={filter} onChange={onFilterChange} />
                        </div>
                    ) : null}
                    <ArticlesView feed={feed} filter={filter} />
                </>
            )}
        </section>
    );
}

function ArticlesView({ feed, filter }: { feed: readonly DiscoverFeedItem[]; filter: CategoryFilter }) {
    const grouped = useMemo(() => groupByCategory(feed.slice(1)), [feed]);

    if (feed.length === 0) {
        return (
            <p className="text-muted-foreground mt-6 px-1 text-xs">Pas encore d&apos;article dans cette catégorie.</p>
        );
    }

    const hero = feed[0];
    if (!hero) return null;

    if (filter !== 'all') {
        const rest = feed.slice(1);
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

function groupByCategory(items: readonly DiscoverFeedItem[]): Partial<Record<JournalCategory, DiscoverFeedItem[]>> {
    const out: Partial<Record<JournalCategory, DiscoverFeedItem[]>> = {};
    for (const item of items) {
        const list = out[item.category] ?? [];
        list.push(item);
        out[item.category] = list;
    }
    return out;
}

interface PiecesSectionProps {
    pieces: readonly MarketplaceItem[];
    isLoading: boolean;
}

function PiecesSection({ pieces, isLoading }: PiecesSectionProps) {
    return (
        <section className="mt-10">
            <h2 className="text-foreground px-1 text-base font-semibold tracking-tight">
                Pièces qui pourraient te plaire
            </h2>
            <p className="text-muted-foreground mt-0.5 px-1 text-xs">Sélectionnées dans la Boutique Lumiris.</p>
            {isLoading ? (
                <p className="text-muted-foreground mt-3 px-1 text-xs">Chargement des pièces…</p>
            ) : pieces.length === 0 ? (
                <EmptyHint
                    text="Aucune pièce en vente pour le moment. Découvre la Boutique."
                    href="/boutique"
                    cta="Voir la Boutique"
                />
            ) : (
                <div className="mt-3 grid grid-cols-2 gap-3">
                    {pieces.map((item, idx) => (
                        <BoutiqueCard key={item.id} item={item} index={idx} />
                    ))}
                </div>
            )}
        </section>
    );
}

interface EmptyHintProps {
    text: string;
    href: string;
    cta: string;
}

function EmptyHint({ text, href, cta }: EmptyHintProps) {
    return (
        <GlassCard intensity="subtle" className="mt-3 flex flex-col items-start gap-2 rounded-2xl p-4">
            <p className="text-muted-foreground text-xs leading-relaxed">{text}</p>
            <Link
                to={href}
                className="text-foreground inline-flex items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline"
            >
                {cta}
                <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
        </GlassCard>
    );
}
