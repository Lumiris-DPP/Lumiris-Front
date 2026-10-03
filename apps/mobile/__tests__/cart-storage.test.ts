import { afterAll, beforeAll, expect, it } from 'bun:test';
import {
    migrateAnonCartToUser,
    pendingPurchaseIds,
    rememberPurchase,
    settlePurchase,
} from '@/lib/marketplace/cart-storage';
import { writeUser } from '@/lib/auth/storage';
import { DEVICE_KEYS } from '@/lib/storage-keys';

const values = new Map<string, string>();
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
beforeAll(() => {
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            localStorage: {
                getItem: (key: string) => values.get(key) ?? null,
                setItem: (key: string, value: string) => values.set(key, value),
                removeItem: (key: string) => values.delete(key),
            },
            dispatchEvent: () => true,
        },
    });
});
afterAll(() => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
});

/** Installe un compte local complet pour contrôler le cloisonnement du stockage. */
function account(id: string) {
    writeUser({
        id,
        email: 'test@example.invalid',
        displayName: 'Test',
        token: 'test',
        refreshToken: 'test',
        createdAt: '2026-10-04',
    });
}

it('fusionne le panier invité sans perdre une déclinaison et reste idempotent', () => {
    values.clear();
    account('a');
    const m = { productId: 'piece', variantId: 'm', quantity: 2, addedAt: '2026-10-04' };
    values.set('lumiris.anon.cart.v1', JSON.stringify([m, { ...m, variantId: 'l', quantity: 1 }]));
    values.set('lumiris.users.a.cart.v1', JSON.stringify([{ ...m, quantity: 1 }]));
    migrateAnonCartToUser('a');
    migrateAnonCartToUser('a');
    expect(JSON.parse(values.get('lumiris.users.a.cart.v1')!)).toEqual([m, { ...m, variantId: 'l', quantity: 1 }]);
    expect(values.has('lumiris.anon.cart.v1')).toBe(false);
});

it('ignore une réponse tardive du paiement de A après passage sur B ou déconnexion', () => {
    values.clear();
    account('b');
    rememberPurchase('pi_a', [{ productId: 'piece', variantId: 'm', quantity: 1 }], 'a');
    expect(pendingPurchaseIds()).toEqual([]);
    expect(values.has('lumiris.users.b.pending-purchases.v1')).toBe(false);
    values.delete(DEVICE_KEYS.authUser);
    rememberPurchase('pi_a', [], 'a');
    expect(values.has('lumiris.anon.pending-purchases.v1')).toBe(false);
});

it('retire une seule fois les lignes confirmées et conserve les ajouts ultérieurs', () => {
    values.clear();
    account('a');
    const line = { productId: 'piece', variantId: 'm', quantity: 3, addedAt: '2026-10-04' };
    values.set('lumiris.users.a.cart.v1', JSON.stringify([line]));
    rememberPurchase('pi_a', [{ ...line, quantity: 1 }], 'a');
    settlePurchase('pi_a');
    settlePurchase('pi_a');
    expect(JSON.parse(values.get('lumiris.users.a.cart.v1')!)).toEqual([{ ...line, quantity: 2 }]);
    expect(pendingPurchaseIds()).toEqual([]);
});
