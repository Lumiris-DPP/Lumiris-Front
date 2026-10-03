import { expect, test } from 'bun:test';
import type { OrderResponse } from '@lumiris/api-client';
import { canSubmitReason, formatDate, isOrderNotFound } from './tracking-model';

const order: OrderResponse = {
    id: 'order-a',
    amountTotalCents: 1000,
    commissionCents: 100,
    status: 'DELIVERED',
    disputeStatus: 'NONE',
    canRequestReturn: true,
    canOpenDispute: true,
    canCancel: false,
};

test('les actions suivent les permissions serveur, même si la feuille est déjà ouverte', () => {
    expect(canSubmitReason(order, 'return')).toBe(true);
    expect(canSubmitReason({ ...order, canRequestReturn: false }, 'return')).toBe(false);
    expect(canSubmitReason(order, 'cancel')).toBe(false);
    expect(canSubmitReason({ ...order, canCancel: true }, 'cancel')).toBe(true);
    expect(canSubmitReason({ ...order, disputeStatus: 'OPEN' }, 'dispute')).toBe(false);
    expect(canSubmitReason(order, 'message')).toBe(true);
    expect(canSubmitReason(order, null)).toBe(false);
});

test('seul un 404 signifie introuvable, pas une panne ou un refus de connexion', () => {
    expect(isOrderNotFound(Object.assign(new Error(), { status: 404 }))).toBe(true);
    for (const status of [0, 401, 403, 500, 503]) {
        expect(isOrderNotFound(Object.assign(new Error(), { status }))).toBe(false);
    }
    expect(isOrderNotFound(null)).toBe(false);
    expect(formatDate('invalide')).toBe('');
});
