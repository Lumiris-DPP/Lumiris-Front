import { notFound } from 'next/navigation';
import { mockJournalPublic, journalArticleBySlug } from '@lumiris/mock-data';
import { JournalArticle } from '@/features/journal-article';

export const dynamicParams = false;

export function generateStaticParams() {
    return mockJournalPublic.map((a) => ({ slug: a.slug }));
}

interface RouteProps {
    params: Promise<{ slug: string }>;
}

export default async function JournalArticleRoute({ params }: RouteProps) {
    const { slug } = await params;
    const article = journalArticleBySlug(slug);
    if (!article) notFound();
    return <JournalArticle article={article} />;
}
