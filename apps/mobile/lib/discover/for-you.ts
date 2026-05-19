// Personnalisation Discover - heuristique mapping `stylePrefs` → catégories Journal,
// croisée avec l'historique de scans Garde-Robe pour les suggestions de pièces.
// Pas de ML : règle d'affinité simple, déterministe.

import { mockJournalPublic, type JournalArticlePublic } from '@lumiris/mock-data';
import type { JournalCategory } from '@lumiris/types';

// Mapping spec D : Casual→entretien, Formel→savoir-faire, Streetwear→portrait-artisan.
// Les autres styles partagent ces 3 catégories pour rester cohérents avec l'éditorial existant.
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
