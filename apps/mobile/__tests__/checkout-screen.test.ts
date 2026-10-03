import { expect, it } from 'bun:test';
import { ApiError } from '@lumiris/api-client';
import { checkoutScreenOf } from '@/features/checkout/models/checkout-screen';
import { cartIntentRequestOf, checkoutContextOf } from '@/features/checkout/models/checkout-context';
import { toMarketplaceItem } from '@/lib/marketplace/product';
import type { MarketplaceItem } from '@lumiris/api-client';
import { EMPTY_ADDRESS } from '@/lib/marketplace/shipping-address';

it('choisit une panne distincte du panier vide et interdit un panier partiel', () => {
    const base = {
        loadState: 'ready' as const,
        lineCount: 1,
        isAuthenticated: true,
        hasBlockingIssue: false,
        intentError: null,
    };
    expect(checkoutScreenOf({ ...base, loadState: 'error' }).kind).toBe('load-error');
    expect(checkoutScreenOf({ ...base, loadState: 'loading' }).kind).toBe('loading');
    expect(checkoutScreenOf({ ...base, lineCount: 0 }).kind).toBe('empty');
    expect(checkoutScreenOf({ ...base, isAuthenticated: false }).kind).toBe('sign-in');
    expect(checkoutScreenOf({ ...base, hasBlockingIssue: true }).kind).toBe('cart-changed');
    expect(checkoutScreenOf({ ...base, intentError: new Error('réseau') }).kind).toBe('payment-down');
    expect(
        checkoutScreenOf({
            ...base,
            intentError: new ApiError({
                code: 'VALIDATION_ERROR',
                status: 422,
                message: 'Stock insuffisant',
                timestamp: 0,
            }),
        }),
    ).toEqual({ kind: 'refused', message: 'Stock insuffisant' });
});

it('ne prépare que les lignes exactes du panier relu pour cet acheteur et cette adresse', () => {
    const variant = { id: 'variante', stock: 3 };
    const product = toMarketplaceItem({
        id: 'piece',
        artisanProfileId: 'atelier',
        name: 'Pièce',
        priceCents: 1000,
        currency: 'EUR',
        stock: 3,
        variants: [variant],
    } as MarketplaceItem);
    const input = {
        onPaymentStep: true,
        address: EMPTY_ADDRESS,
        buyerId: 'acheteur',
        hasBlockingIssue: false,
        items: [{ product, variant, quantity: 2 }],
    };
    const context = checkoutContextOf(input)!;
    expect(context.buyerId).toBe('acheteur');
    expect(cartIntentRequestOf(context)).toEqual({
        items: [{ productId: 'piece', variantId: 'variante', quantity: 2 }],
        shipping: EMPTY_ADDRESS,
    });
    expect(checkoutContextOf({ ...input, hasBlockingIssue: true })).toBeNull();
    expect(checkoutContextOf({ ...input, buyerId: null })).toBeNull();
    expect(checkoutContextOf({ ...input, address: null })).toBeNull();
    expect(checkoutContextOf({ ...input, onPaymentStep: false })).toBeNull();
    expect(checkoutContextOf({ ...input, items: [] })).toBeNull();
});
