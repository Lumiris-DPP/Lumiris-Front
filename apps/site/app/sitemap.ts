import type { MetadataRoute } from 'next';
import { mockPassportsPublic } from '@lumiris/mock-data';
import { fetchPublicArtisans } from '@/lib/public-artisan-api';
import { getAllArticles } from '@/lib/journal';
import { getAllRegulations } from '@/lib/reglementation';

const SITE_URL = 'https://lumiris.fr';

const STATIC_PATHS: ReadonlyArray<{ path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }> = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/artisans', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/journal', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/reglementation', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/atelier', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/charte-independance', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/mentions-legales', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/confidentialite', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/cgu', priority: 0.3, changeFrequency: 'monthly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((s) => ({
        url: `${SITE_URL}${s.path}`,
        lastModified: now,
        changeFrequency: s.changeFrequency,
        priority: s.priority,
    }));

    const passportEntries: MetadataRoute.Sitemap = mockPassportsPublic.map((view) => ({
        url: `${SITE_URL}/passeport/${view.passport.id}`,
        lastModified: new Date(view.passport.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    const artisanEntries: MetadataRoute.Sitemap = (await fetchPublicArtisans()).map((a) => ({
        url: `${SITE_URL}/artisans/${a.slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    const journalEntries: MetadataRoute.Sitemap = getAllArticles().map((a) => ({
        url: `${SITE_URL}/journal/${a.slug}`,
        lastModified: new Date(a.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    const regulationEntries: MetadataRoute.Sitemap = getAllRegulations().map((r) => ({
        url: `${SITE_URL}/reglementation/${r.slug}`,
        lastModified: new Date(r.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    return [...staticEntries, ...passportEntries, ...artisanEntries, ...journalEntries, ...regulationEntries];
}
