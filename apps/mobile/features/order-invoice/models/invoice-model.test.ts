import { expect, test } from 'bun:test';
import type { OrderGroup, OrderResponse } from '@lumiris/api-client';
import { formatInvoiceDate, invoiceAmounts } from './invoice-model';

const line: OrderResponse = {
    id: 'a',
    status: 'PAID',
    disputeStatus: 'NONE',
    amountTotalCents: 1000,
    commissionCents: 100,
};
const group: OrderGroup = {
    paymentIntentId: 'pi_test',
    lines: [line],
    status: 'PAID',
    itemsTotalCents: 1000,
    shippingCents: 200,
    amountChargedCents: 1200,
};

test('les remboursements des lignes se cumulent, sans perdre les frais de livraison', () => {
    const result = invoiceAmounts({
        ...group,
        amountChargedCents: 2400,
        lines: [
            { ...line, refundedCents: 300 },
            { ...line, id: 'b', refundedCents: 500 },
        ],
    });
    expect(result).toEqual({ refundedCents: 800, remainingCents: 1600, paymentConfirmed: true });
    expect(invoiceAmounts({ ...group, lines: [{ ...line, refundedCents: 1200 }] }).remainingCents).toBe(0);
});

test('une annulation sans facture ne prouve pas un paiement et une ligne pending bloque l’impression', () => {
    expect(
        invoiceAmounts({ ...group, status: 'CANCELLED', lines: [{ ...line, status: 'CANCELLED' }] }).paymentConfirmed,
    ).toBe(false);
    expect(
        invoiceAmounts({
            ...group,
            status: 'CANCELLED',
            lines: [{ ...line, status: 'CANCELLED', invoiceNumber: 'INV-A' }],
        }).paymentConfirmed,
    ).toBe(true);
    expect(invoiceAmounts({ ...group, lines: [{ ...line, status: 'PENDING' }] }).paymentConfirmed).toBe(false);
    expect(invoiceAmounts({ ...group, lines: [] }).paymentConfirmed).toBe(false);
});

test('une date absente ne devient pas la date du jour', () => {
    expect(formatInvoiceDate(null)).toBe('—');
    expect(formatInvoiceDate('invalide')).toBe('—');
    expect(formatInvoiceDate('2026-10-03T12:00:00Z')).toBe('3 octobre 2026');
});
