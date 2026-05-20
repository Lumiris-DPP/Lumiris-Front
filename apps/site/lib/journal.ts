import type { ComponentType } from 'react';
import * as A1 from '@/content/journal/comprendre-le-dpp-textile.mdx';
import * as A2 from '@/content/journal/agec-pour-les-artisans.mdx';
import * as A3 from '@/content/journal/registre-central-dpp-juillet-2026.mdx';
import * as A4 from '@/content/journal/portrait-marie-dubois-couturiere-bretagne.mdx';
import * as A5 from '@/content/journal/savoir-faire-tissage-lozere.mdx';
import * as A6 from '@/content/journal/entretien-laine-naturelle.mdx';
import type { JournalCategory } from '@lumiris/types';
import { asMdxArticleModule, type MdxArticleModule } from './mdx-types';

export interface ArticleMeta {
    slug: string;
    title: string;
    category: JournalCategory;
    author: string;
    publishedAt: string;
    readingTime: number;
    excerpt: string;
    coverImage: string;
}

export interface Article extends ArticleMeta {
    Component: ComponentType;
}

function isArticleMeta(meta: unknown): meta is ArticleMeta {
    if (!meta || typeof meta !== 'object') return false;
    const m = meta as Record<string, unknown>;
    return (
        typeof m.slug === 'string' &&
        typeof m.title === 'string' &&
        typeof m.category === 'string' &&
        typeof m.author === 'string' &&
        typeof m.publishedAt === 'string' &&
        typeof m.readingTime === 'number' &&
        typeof m.excerpt === 'string' &&
        typeof m.coverImage === 'string'
    );
}

const MODULES: ReadonlyArray<MdxArticleModule<ArticleMeta>> = [A1, A2, A3, A4, A5, A6]
    .map((m): MdxArticleModule<ArticleMeta> | null => asMdxArticleModule(m, isArticleMeta))
    .filter((m): m is MdxArticleModule<ArticleMeta> => m !== null);

const ARTICLES: readonly Article[] = MODULES.map((m) => ({ ...m.meta, Component: m.default })).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
);

const BY_SLUG = new Map<string, Article>(ARTICLES.map((a) => [a.slug, a]));

export function getAllArticles(): readonly Article[] {
    return ARTICLES;
}

export function getArticleBySlug(slug: string): Article | undefined {
    return BY_SLUG.get(slug);
}

export function getRelatedArticles(article: Article, limit = 3): readonly Article[] {
    return ARTICLES.filter((a) => a.slug !== article.slug && a.category === article.category).slice(0, limit);
}
