import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { subscriptionAccess } from './subscription-sale-state';

test('chargement, 401/503, inactivité et reprise restent distincts pour la vente', () => {
    assert.equal(subscriptionAccess({ isError: false, isSuccess: false }).saleState, 'loading');
    assert.equal(subscriptionAccess({ isError: true, isSuccess: false }).saleState, 'error');
    assert.equal(
        subscriptionAccess({ isError: false, isSuccess: true, data: { hasActiveSubscription: false } }).saleState,
        'inactive',
    );
    assert.equal(
        subscriptionAccess({ isError: false, isSuccess: true, data: { hasActiveSubscription: true } }).saleState,
        'active',
    );
});

test('une relecture en échec bloque la vente sans retirer l’abonnement connu à l’atelier', () => {
    const access = subscriptionAccess({ isError: true, isSuccess: false, data: { hasActiveSubscription: true } });
    assert.equal(access.saleState, 'error');
    assert.equal(access.hasActiveSubscription, true);
});
