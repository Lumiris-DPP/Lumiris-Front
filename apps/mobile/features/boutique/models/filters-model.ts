import type { MarketplaceItem as MarketplaceItemDto } from '@lumiris/api-client';
import type { IrisGrade } from '@lumiris/types';
import { toMarketplaceItem, type MarketplaceItem, type MarketplaceSort } from '@/lib/marketplace/product';

export const GRADE_OPTIONS: readonly IrisGrade[] = ['A', 'B', 'C', 'D', 'E'];

export interface PriceBounds {
    min: number;
    max: number;
}

export interface BoutiqueFiltersState {
    q: string;

    categories: readonly string[];
    grades: readonly IrisGrade[];

    materials: readonly string[];

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

// Garde les produits autorisés à la vente dans l’application.
export function sellableItems(dtos: readonly MarketplaceItemDto[]): readonly MarketplaceItem[] {
    return dtos.filter((dto) => dto.inAppSale !== false).map(toMarketplaceItem);
}

// Calcule les bornes de prix du catalogue.
export function priceBoundsOf(items: readonly MarketplaceItem[]): PriceBounds {
    if (items.length === 0) return { min: 0, max: 0 };
    const prices = items.map((i) => i.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

// Liste les catégories présentes dans le catalogue.
export function categoryOptionsOf(items: readonly MarketplaceItem[]): readonly string[] {
    return distinctSorted(items.map((item) => item.category));
}

// Liste les matières présentes dans le catalogue.
export function materialOptionsOf(items: readonly MarketplaceItem[]): readonly string[] {
    return distinctSorted(items.map((item) => item.material));
}

// Trie les valeurs renseignées sans doublon.
function distinctSorted(values: ReadonlyArray<string | null>): readonly string[] {
    const set = new Set<string>();
    for (const value of values) if (value) set.add(value);
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
}

// Garde les pièces correspondant aux filtres choisis.
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

// Compte les groupes de filtres actifs.
export function activeBoutiqueFilterCount(state: BoutiqueFiltersState): number {
    return state.categories.length + state.grades.length + state.materials.length + (state.priceRange ? 1 : 0);
}

// Ajoute ou retire une valeur de la sélection.
export function toggleValue<T>(list: readonly T[], value: T): readonly T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Réinitialise les filtres détaillés en conservant la recherche et le tri.
export function clearBoutiqueFacets(state: BoutiqueFiltersState): BoutiqueFiltersState {
    return { ...EMPTY_BOUTIQUE_FILTERS, q: state.q, sort: state.sort };
}
