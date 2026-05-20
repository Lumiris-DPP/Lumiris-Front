import { mockJournalPublic, type JournalArticlePublic } from '@lumiris/mock-data';
import type { JournalCategory } from '@lumiris/types';

const STYLE_TO_CATEGORIES: Record<string, readonly JournalCategory[]> = {
    Casual: ['entretien'],
    Formel: ['savoir-faire'],
    Streetwear: ['portrait-artisan'],
    Vintage: ['portrait-artisan', 'savoir-faire'],
    Sport: ['entretien'],
    Workwear: ['savoir-faire', 'portrait-artisan'],
};

function categoriesForStyles(stylePrefs: readonly string[]): readonly JournalCategory[] {
    const set = new Set<JournalCategory>();
    for (const style of stylePrefs) {
        const mapped = STYLE_TO_CATEGORIES[style];
        if (!mapped) continue;
        for (const cat of mapped) set.add(cat);
    }
    return Array.from(set);
}

export function articlesForStyles(stylePrefs: readonly string[]): readonly JournalArticlePublic[] {
    const cats = new Set(categoriesForStyles(stylePrefs));
    if (cats.size === 0) return [];
    return mockJournalPublic
        .filter((a) => cats.has(a.category))
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
