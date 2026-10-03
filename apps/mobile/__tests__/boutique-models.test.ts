import { describe, expect, it } from 'bun:test';
import type { MarketplaceItem as ProductDto } from '@lumiris/api-client';
import { toMarketplaceItem } from '@/lib/marketplace/product';
import { installmentLabel } from '@/lib/marketplace/money';
import {
    applyBoutiqueFilters,
    categoryOptionsOf,
    clearBoutiqueFacets,
    EMPTY_BOUTIQUE_FILTERS,
    materialOptionsOf,
    priceBoundsOf,
    sellableItems,
} from '@/features/boutique/models/filters-model';
import {
    initialSelectionOf,
    purchaseStateOf,
    shippingTermsOf,
    stockHintOf,
} from '@/features/boutique/models/purchase-state';

/** Produit de catalogue avec axes et stock pour les scénarios de sélection et de filtrage. */
function product(overrides: Partial<ProductDto> = {}): ProductDto {
    return {
        id: 'piece',
        artisanProfileId: 'atelier',
        name: 'Chemise',
        priceCents: 19900,
        currency: 'EUR',
        stock: 3,
        inAppSale: true,
        category: 'SHIRT',
        material: 'Lin',
        variants: [
            { id: 'm-bleu', sizeLabel: ' M ', colorLabel: 'Bleu', stock: 3 },
            { id: 'l-bleu', sizeLabel: 'L', colorLabel: 'Bleu', stock: 0 },
        ],
        ...overrides,
    } as ProductDto;
}

describe('boutique : facettes du catalogue et combinaison de filtres', () => {
    it('exclut les pièces hors vente in-app et conserve le tri serveur', () => {
        const items = sellableItems([
            product({ id: 'premier' }),
            product({ id: 'cache', inAppSale: false }),
            product({ id: 'dernier' }),
        ]);
        expect(items.map((item) => item.id)).toEqual(['premier', 'dernier']);
    });
    it('calcule les facettes sur le catalogue complet, même si les résultats sont restreints', () => {
        const all = sellableItems([
            product(),
            product({ id: 'robe', category: 'DRESS', material: 'Coton', priceCents: 8901 }),
        ]);
        const filtered = applyBoutiqueFilters(all, {
            ...EMPTY_BOUTIQUE_FILTERS,
            categories: ['SHIRT'],
            materials: ['Lin'],
            priceRange: [199, 199],
        });
        expect(filtered.map((item) => item.id)).toEqual(['piece']);
        expect(categoryOptionsOf(all)).toEqual(['DRESS', 'SHIRT']);
        expect(materialOptionsOf(all)).toEqual(['Coton', 'Lin']);
        expect(priceBoundsOf(all)).toEqual({ min: 89, max: 199 });
        expect(priceBoundsOf([])).toEqual({ min: 0, max: 0 });
    });
    it('refuse les données absentes pour une facette choisie et ne refait pas la recherche serveur', () => {
        const all = sellableItems([product({ category: null, material: null, irisGrade: null })]);
        expect(applyBoutiqueFilters(all, { ...EMPTY_BOUTIQUE_FILTERS, grades: ['A'] })).toEqual([]);
        expect(applyBoutiqueFilters(all, { ...EMPTY_BOUTIQUE_FILTERS, materials: ['Lin'] })).toEqual([]);
        expect(applyBoutiqueFilters(all, { ...EMPTY_BOUTIQUE_FILTERS, q: 'recherche serveur' })).toHaveLength(1);
    });
    it('réinitialise seulement les facettes, en gardant recherche et tri', () => {
        const state = { ...EMPTY_BOUTIQUE_FILTERS, q: 'lin', categories: ['SHIRT'], sort: 'price-desc' as const };
        expect(clearBoutiqueFacets(state)).toEqual({ ...EMPTY_BOUTIQUE_FILTERS, q: 'lin', sort: 'price-desc' });
        expect(state.categories).toEqual(['SHIRT']);
    });
});

describe('fiche : variantes, rupture et montants annoncés', () => {
    it('demande les deux axes puis distingue rupture et combinaison inexistante', () => {
        const item = toMarketplaceItem(product());
        expect(purchaseStateOf(item, { size: null, color: null }).kind).toBe('needs-size');
        expect(purchaseStateOf(item, { size: 'M', color: null }).kind).toBe('needs-color');
        expect(stockHintOf(purchaseStateOf(item, { size: 'M', color: 'Bleu' }))).toBe('Plus que 3 en stock');
        expect(purchaseStateOf(item, { size: 'L', color: 'Bleu' }).kind).toBe('sold-out');
        expect(purchaseStateOf(item, { size: 'M', color: 'Rouge' }).kind).toBe('unavailable');
    });
    it('présélectionne une déclinaison sans axe en normalisant ses libellés vides', () => {
        const item = toMarketplaceItem(
            product({ variants: [{ id: 'unique', sizeLabel: ' ', colorLabel: '', stock: 1 }] }),
        );
        expect(initialSelectionOf(item)).toEqual({ size: null, color: null });
        expect(purchaseStateOf(item, initialSelectionOf(item)).kind).toBe('ready');
        expect(purchaseStateOf(toMarketplaceItem(product({ variants: [] })), { size: null, color: null }).kind).toBe(
            'unavailable',
        );
    });
    it('ne transforme pas le port inconnu en livraison gratuite', () => {
        expect(shippingTermsOf(null)).toBe('Expédiée à domicile.');
        expect(shippingTermsOf(0)).toContain('Offerte');
        expect(shippingTermsOf(590)).toContain('5,90');
    });
    it('annonce le fractionné uniquement si activé et répartit le reliquat au centime', () => {
        const options = { installmentsEnabled: true, installmentCount: 3, installmentMinCents: 10000 };
        expect(installmentLabel(19900, undefined)).toBeNull();
        expect(installmentLabel(9999, options)).toBeNull();
        expect(installmentLabel(19900, { ...options, installmentsEnabled: false })).toBeNull();
        expect(installmentLabel(19900, options)).toContain('66,34');
        expect(installmentLabel(19900, options)).toContain('puis 2×');
    });
});
