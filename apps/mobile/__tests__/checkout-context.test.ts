import { describe, expect, it } from 'bun:test';
import {
    checkoutContextKey,
    paymentIntentIdOf,
    type CheckoutContext,
} from '@/features/checkout/models/checkout-context';

const address = {
    fullName: 'Acheteur Test',
    line1: '1 rue du Test',
    line2: '',
    postalCode: '75001',
    city: 'Paris',
    country: 'FR',
    phone: '',
};

const context: CheckoutContext = {
    buyerId: 'buyer-1',
    lines: [
        { productId: 'p1', variantId: 'p1-m', quantity: 1 },
        { productId: 'p2', variantId: 'p2-s', quantity: 2 },
    ],
    address,
};

describe('checkoutContextKey — un PaymentIntent par contexte', () => {
    it('ne dépend pas de l’ordre des lignes', () => {
        const reordered = { ...context, lines: [...context.lines].reverse() };
        expect(checkoutContextKey(reordered)).toBe(checkoutContextKey(context));
    });

    it('change avec l’acheteur : deux comptes ne partagent jamais un paiement', () => {
        expect(checkoutContextKey({ ...context, buyerId: 'buyer-2' })).not.toBe(checkoutContextKey(context));
    });

    it('change avec une quantité ou une ligne ajoutée pendant l’achat', () => {
        const more = { ...context, lines: [...context.lines, { productId: 'p3', variantId: 'p3-m', quantity: 1 }] };
        const quantity = { ...context, lines: [{ ...context.lines[0]!, quantity: 2 }, context.lines[1]!] };
        expect(checkoutContextKey(more)).not.toBe(checkoutContextKey(context));
        expect(checkoutContextKey(quantity)).not.toBe(checkoutContextKey(context));
    });

    it('change avec l’adresse de livraison', () => {
        expect(checkoutContextKey({ ...context, address: { ...address, city: 'Lyon' } })).not.toBe(
            checkoutContextKey(context),
        );
    });
});

describe('paymentIntentIdOf', () => {
    it('lit l’identifiant du PaymentIntent dans son client secret', () => {
        expect(paymentIntentIdOf('pi_3Abc_secret_xyz')).toBe('pi_3Abc');
    });

    it('ne renvoie jamais un secret client de forme inattendue', () => {
        expect(paymentIntentIdOf('secret_sans_identifiant')).toBeNull();
        expect(paymentIntentIdOf('_secret_xyz')).toBeNull();
    });
});
