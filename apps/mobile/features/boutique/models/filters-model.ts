// Filtres de la Boutique : état, facettes et application, sans React. L'écran garde le rendu, le
// hook de catalogue garde les requêtes ; ici tout se teste avec Bun.

import type { MarketplaceItem as MarketplaceItemDto } from '@lumiris/api-client';
import type { IrisGrade } from '@lumiris/types';
import { toMarketplaceItem, type MarketplaceItem, type MarketplaceSort } from '@/lib/marketplace/product';

export const GRADE_OPTIONS: readonly IrisGrade[] = ['A', 'B', 'C', 'D', 'E'];

export interface PriceBounds {
    min: number;
    max: number;
}

export interface BoutiqueFiltersState {
    /** Recherche plein texte, envoyée au backend (nom, matière, description). */
    q: string;
    /** Catégories produit (chaînes réelles du catalogue). */
    categories: readonly string[];
    grades: readonly IrisGrade[];
    /** Matières dominantes (chaînes réelles du catalogue). */
    materials: readonly string[];
    /** Fourchette de prix [min, max] en euros, ou null si non bornée. */
    priceRange: readonly [number, number] | null;
    sort: MarketplaceSort;
}

export const EMPTY_BOUTIQUE_FILTERS: BoutiqueFiltersState = {
    q: '',
    categories: [],
    grades: [],
    materials: [],
    priceRange: null,
    sort: 'relevance',
};

/** Projette le catalogue reçu en ne gardant que les pièces achetables dans l'app. */
export function sellableItems(dtos: readonly MarketplaceItemDto[]): readonly MarketplaceItem[] {
    return dtos.filter((dto) => dto.inAppSale !== false).map(toMarketplaceItem);
}

/** Bornes de prix observées sur l'ensemble des pièces en vente. */
export function priceBoundsOf(items: readonly MarketplaceItem[]): PriceBounds {
    if (items.length === 0) return { min: 0, max: 0 };
    const prices = items.map((i) => i.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

/** Options de catégories réellement présentes dans le catalogue. */
export function categoryOptionsOf(items: readonly MarketplaceItem[]): readonly string[] {
    return distinctSorted(items.map((item) => item.category));
}

/** Options de matières réellement présentes dans le catalogue. */
export function materialOptionsOf(items: readonly MarketplaceItem[]): readonly string[] {
    return distinctSorted(items.map((item) => item.material));
}

/** Rassemble les valeurs renseignées, sans doublon, dans l'ordre alphabétique français. */
function distinctSorted(values: ReadonlyArray<string | null>): readonly string[] {
    const set = new Set<string>();
    for (const value of values) if (value) set.add(value);
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
}

/** Garde les pièces qui passent chaque facette choisie ; une facette vide ne filtre rien. */
export function applyBoutiqueFilters(
    items: readonly MarketplaceItem[],
    state: BoutiqueFiltersState,
): readonly MarketplaceItem[] {
    return items.filter((item) => {
        if (state.categories.length > 0 && (!item.category || !state.categories.includes(item.category))) return false;
        if (state.grades.length > 0 && (!item.irisGrade || !state.grades.includes(item.irisGrade))) return false;
        if (state.materials.length > 0 && (!item.material || !state.materials.includes(item.material))) return false;
        if (state.priceRange) {
            if (item.price < state.priceRange[0] || item.price > state.priceRange[1]) return false;
        }
        return true;
    });
}

/** Compte les facettes actives affichées sur le bouton « Filtres » ; la recherche et le tri n'en sont pas. */
export function activeBoutiqueFilterCount(state: BoutiqueFiltersState): number {
    return state.categories.length + state.grades.length + state.materials.length + (state.priceRange ? 1 : 0);
}

/** Ajoute la valeur absente ou retire la valeur présente. */
export function toggleValue<T>(list: readonly T[], value: T): readonly T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Efface les facettes en gardant la recherche et le tri, que le bouton « Réinitialiser » ne vise pas. */
export function clearBoutiqueFacets(state: BoutiqueFiltersState): BoutiqueFiltersState {
    return { ...EMPTY_BOUTIQUE_FILTERS, q: state.q, sort: state.sort };
}
