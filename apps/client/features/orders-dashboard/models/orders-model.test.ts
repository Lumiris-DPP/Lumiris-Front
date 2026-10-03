import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { SellerOrder } from '@lumiris/api-client';
import { groupByTab, heldOrderCents } from './orders-model';
import { parseRefundCents, refundableCents } from './refund-model';

const order: SellerOrder = {
    id: 'a',
    status: 'PAID',
    disputeStatus: 'NONE',
    amountTotalCents: 1000,
    shippingCents: 200,
    commissionCents: 100,
    netCents: 1100,
    released: false,
    canShip: true,
    canDecideReturn: false,
    canMarkReturnReceived: false,
    canRefund: true,
    canCancel: true,
    timeline: [],
};

test('le litige prime et le regroupement conserve les commandes intactes', () => {
    const disputed = { ...order, id: 'b', disputeStatus: 'OPEN' as const };
    const returned = { ...order, id: 'c', status: 'RETURN_RECEIVED' as const };
    const input = Object.freeze([order, disputed, returned]);
    const grouped = groupByTab(input);
    assert.deepEqual(grouped.TO_SHIP, [order]);
    assert.equal(grouped.DISPUTES[0], disputed);
    assert.equal(grouped.RETURNS[0], returned);
    assert.equal(input.length, 3);
});

test('le reliquat inclut le port et les remboursements déjà persistés', () => {
    assert.equal(refundableCents(order), 1200);
    assert.equal(refundableCents({ ...order, refundedCents: 400 }), 800);
    assert.equal(refundableCents({ ...order, refundedCents: 1200 }), 0);
    assert.equal(refundableCents({ ...order, shippingCents: null, refundedCents: null }), 1000);
});

test('une commande annulée ne gonfle pas les fonds retenus', () => {
    assert.equal(heldOrderCents(order), 1100);
    assert.equal(heldOrderCents({ ...order, status: 'CANCELLED', refundedCents: 1200 }), 0);
    assert.equal(heldOrderCents({ ...order, status: 'REFUNDED' }), 0);
    assert.equal(heldOrderCents({ ...order, released: true }), 0);
});

test('la saisie exige des centimes exacts et refuse les formats accidentels de Number', () => {
    assert.equal(parseRefundCents('12,34'), 1234);
    assert.equal(parseRefundCents(' 0.01 '), 1);
    assert.equal(parseRefundCents('12.3'), 1230);
    assert.equal(parseRefundCents('0'), 0);
    for (const value of ['', '1.005', '1e2', '0x10', '-1', 'Infinity', '12,3,4', '999999999999999999']) {
        assert.equal(parseRefundCents(value), null);
    }
});
