import { describe, expect, it } from 'bun:test';
import type { MarketplaceItem as MarketplaceItemDto } from '@lumiris/api-client';
import {
    buildCartDetails,
    isPaidOrderStatus,
    purchasesToSettle,
    subtractPurchase,
    type CartLine,
} from '@/lib/marketplace/cart-model';
import type { MarketplaceItem } from '@/lib/marketplace/product';

// Prépare un produit pour les tests.
function product(
    id: string,
    options: { artisan?: string; priceCents?: number; shippingCents?: number; stocks?: Record<string, number> } = {},
): MarketplaceItem {
    const stocks = options.stocks ?? { [`${id}-m`]: 5 };
    return {
        id,
        dppFormId: null,
        artisanProfileId: options.artisan ?? 'atelier-a',
        name: `Pièce ${id}`,
        description: null,
        category: null,
        material: null,
        originCountry: null,
        priceCents: options.priceCents ?? 8900,
        price: (options.priceCents ?? 8900) / 100,
        currency: 'EUR',
        stock: Object.values(stocks).reduce((sum, n) => sum + n, 0),
        photoUrl: null,
        artisanName: options.artisan ?? 'atelier-a',
        irisGrade: null,
        irisTotal: null,
        createdAt: null,
        shippingCents: options.shippingCents ?? 690,
        returnPolicy: null,
        warrantyDescription: null,
        variants: Object.entries(stocks).map(([variantId, stock]) => ({ id: variantId, stock, sizeLabel: 'M' })),
        sizeGuide: [],
        preparationDays: 0,
        atelierPausedUntil: null,
        source: {} as MarketplaceItemDto,
    };
}

// Prépare une ligne de panier pour les tests.
function line(productId: string, variantId: string | null, quantity = 1, addedAt = '2026-10-03T10:00:00Z'): CartLine {
    return { productId, variantId, quantity, addedAt };
}

describe('buildCartDetails — lecture du catalogue', () => {
    it('panne de lecture : aucune pièce déclarée indisponible, le panier est conservé et le paiement bloqué', () => {
        const lines = [line('p1', 'p1-m')];
        const cart = buildCartDetails(lines, undefined, 'error');
        expect(cart.unavailable).toHaveLength(0);
        expect(cart.lines).toEqual(lines);
        expect(cart.hasBlockingIssue).toBe(true);
    });

    it('lecture en cours : rien n’est indisponible mais rien ne se paie encore', () => {
        const cart = buildCartDetails([line('p1', 'p1-m')], undefined, 'loading');
        expect(cart.unavailable).toHaveLength(0);
        expect(cart.hasBlockingIssue).toBe(true);
    });

    it('réponse réussie sans la fiche : la pièce est réellement indisponible', () => {
        const cart = buildCartDetails([line('p1', 'p1-m'), line('p2', 'p2-m')], [product('p1')], 'ready');
        expect(cart.unavailable.map((l) => l.productId)).toEqual(['p2']);
        expect(cart.items).toHaveLength(1);
        expect(cart.hasBlockingIssue).toBe(true);
    });

    it('panier valide : totaux exacts, un port par atelier égal au plus élevé de ses pièces', () => {
        const cart = buildCartDetails(
            [line('p1', 'p1-m', 2), line('p2', 'p2-m'), line('p3', 'p3-m')],
            [
                product('p1', { shippingCents: 500 }),
                product('p2', { shippingCents: 900 }),
                product('p3', { artisan: 'atelier-b', priceCents: 1000, shippingCents: 0 }),
            ],
            'ready',
        );
        expect(cart.hasBlockingIssue).toBe(false);
        expect(cart.subtotalCents).toBe(8900 * 3 + 1000);
        expect(cart.shipments.map((s) => s.shippingCents)).toEqual([900, 0]);
        expect(cart.totalCents).toBe(8900 * 3 + 1000 + 900);
        expect(cart.count).toBe(4);
    });

    it('stock public insuffisant : signalé sans bloquer, le serveur tranche (réservation de l’acheteur comprise)', () => {
        const cart = buildCartDetails([line('p1', 'p1-m', 1)], [product('p1', { stocks: { 'p1-m': 0 } })], 'ready');
        expect(cart.overstocked).toHaveLength(1);
        expect(cart.hasBlockingIssue).toBe(false);
    });

    it('ligne héritée sans déclinaison sur une annonce déclinée : l’acheteur doit choisir', () => {
        const cart = buildCartDetails([line('p1', null)], [product('p1', { stocks: { s: 1, m: 1 } })], 'ready');
        expect(cart.needsVariant.map((l) => l.productId)).toEqual(['p1']);
        expect(cart.hasBlockingIssue).toBe(true);
    });
});

describe('subtractPurchase — retrait des seules lignes payées', () => {
    it('retire exactement la ligne payée et garde les autres', () => {
        const remaining = subtractPurchase(
            [line('p1', 'p1-m'), line('p2', 'p2-m')],
            [{ productId: 'p1', variantId: 'p1-m', quantity: 1 }],
        );
        expect(remaining.map((l) => l.productId)).toEqual(['p2']);
    });

    it('préserve une quantité ajoutée après le paiement sur la même pièce', () => {
        const remaining = subtractPurchase(
            [line('p1', 'p1-m', 3)],
            [{ productId: 'p1', variantId: 'p1-m', quantity: 1 }],
        );
        expect(remaining).toEqual([line('p1', 'p1-m', 2)]);
    });

    it('ne touche pas une autre taille de la même annonce', () => {
        const remaining = subtractPurchase(
            [line('p1', 'p1-s'), line('p1', 'p1-m')],
            [{ productId: 'p1', variantId: 'p1-m', quantity: 1 }],
        );
        expect(remaining).toEqual([line('p1', 'p1-s')]);
    });

    it('ne retire rien quand la pièce a déjà quitté le panier', () => {
        const remaining = subtractPurchase([line('p2', 'p2-m')], [{ productId: 'p1', variantId: 'p1-m', quantity: 1 }]);
        expect(remaining).toEqual([line('p2', 'p2-m')]);
    });
});

describe('purchasesToSettle — paiement confirmé après la fin de l’attente', () => {
    it('payé : lignes à retirer ; annulé ou remboursé : mémo oublié ; en attente ou inconnu : on attend', () => {
        const result = purchasesToSettle(
            ['pi_paye', 'pi_annule', 'pi_rembourse', 'pi_attente', 'pi_inconnu'],
            [
                { paymentIntentId: 'pi_paye', status: 'PAID' },
                { paymentIntentId: 'pi_annule', status: 'CANCELLED' },
                { paymentIntentId: 'pi_rembourse', status: 'REFUNDED' },
                { paymentIntentId: 'pi_attente', status: 'PENDING' },
                { paymentIntentId: 'autre', status: 'PAID' },
            ],
        );
        expect(result.paid).toEqual(['pi_paye']);
        expect(result.dropped).toEqual(['pi_annule', 'pi_rembourse']);
    });

    it('une commande expédiée ou livrée a bien été payée', () => {
        expect(isPaidOrderStatus('SHIPPED')).toBe(true);
        expect(isPaidOrderStatus('DELIVERED')).toBe(true);
        expect(isPaidOrderStatus('PENDING')).toBe(false);
    });
});
