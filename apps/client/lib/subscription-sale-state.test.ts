import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { subscriptionSaleState } from './subscription-sale-state';

test('chargement, 401/503, donnée périmée, inactivité et reprise restent distincts', () => {
    assert.equal(subscriptionSaleState(false, false, false), 'loading');
    assert.equal(subscriptionSaleState(true, false, false), 'error');
    assert.equal(subscriptionSaleState(true, false, true), 'error');
    assert.equal(subscriptionSaleState(false, true, false), 'inactive');
    assert.equal(subscriptionSaleState(false, true, true), 'active');
});
