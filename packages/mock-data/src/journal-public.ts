import type { JournalArticle } from '@lumiris/types';
import { mockJournalArticles } from './journal';

export interface JournalArticlePublic extends JournalArticle {
    slug: string;
}

// « Scheduled » = programmé, donc pas encore paru : l'inclure faisait apparaître des brouillons
// dans le Journal public.
const PUBLIC_STATUSES: ReadonlyArray<JournalArticle['status']> = ['Published'];

function slugify(input: string): string {
    return input
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export const mockJournalPublic: readonly JournalArticlePublic[] = mockJournalArticles
    .filter((a) => PUBLIC_STATUSES.includes(a.status))
    .map((a) => ({ ...a, slug: a.slug ?? slugify(a.title) }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

const BY_SLUG = new Map<string, JournalArticlePublic>(mockJournalPublic.map((a) => [a.slug, a]));

export function journalArticleBySlug(slug: string): JournalArticlePublic | undefined {
    return BY_SLUG.get(slug);
}
