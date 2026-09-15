import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JournalArticleView } from '@/features/journal-article';
import { JsonLd } from '@/features/json-ld';
import { getAllArticles, getArticleBySlug, getRelatedArticles } from '@/lib/journal';
import { SITE_URL } from '@/lib/urls';

export const dynamicParams = false;

export function generateStaticParams() {
    return getAllArticles().map((a) => ({ slug: a.slug }));
}

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { slug } = await params;
    const article = getArticleBySlug(slug);
    if (!article) return {};

    const description = article.excerpt.length > 160 ? `${article.excerpt.slice(0, 157).trimEnd()}…` : article.excerpt;
    const canonical = `/journal/${article.slug}`;

    return {
        title: article.title,
        description,
        alternates: { canonical },
        openGraph: {
            type: 'article',
            url: canonical,
            title: article.title,
            description,
            images: article.coverImage ? [{ url: article.coverImage }] : undefined,
            authors: [article.author],
            publishedTime: article.publishedAt,
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description,
            images: article.coverImage ? [article.coverImage] : undefined,
        },
    };
}

export default async function JournalArticlePage({ params }: RouteProps) {
    const { slug } = await params;
    const article = getArticleBySlug(slug);
    if (!article) notFound();

    const related = getRelatedArticles(article, 3);

    const articleJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt,
        image: article.coverImage || undefined,
        author: { '@type': 'Person', name: article.author },
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
        publisher: {
            '@type': 'Organization',
            name: 'LUMIRIS',
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/journal/${article.slug}` },
    };

    return (
        <>
            <JsonLd data={articleJsonLd} />
            <JournalArticleView article={article} related={related} />
        </>
    );
}
