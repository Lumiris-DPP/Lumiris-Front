import type { Metadata } from 'next';
import { JournalContent } from '@/features/journal-content';
import { getAllArticles, type ArticleMeta } from '@/lib/journal';

export const metadata: Metadata = {
    title: 'Journal - DPP, ESPR, AGEC et portraits d’artisans',
    description:
        'Le journal LUMIRIS - décryptages réglementaires (DPP textile, ESPR, AGEC), portraits d’artisans français, savoir-faire et entretien.',
    alternates: { canonical: '/journal' },
};

export default function JournalPage() {
    const articles: ArticleMeta[] = getAllArticles().map(({ Component, ...meta }) => {
        void Component;
        return meta;
    });
    return <JournalContent articles={articles} />;
}
