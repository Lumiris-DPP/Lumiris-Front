import type { OrderGroup } from '@lumiris/api-client';

// Calcule les remboursements, le reste à charge et la confirmation du paiement.
export function invoiceAmounts(group: OrderGroup) {
    const refundedCents = group.lines.reduce((sum, line) => sum + (line.refundedCents ?? 0), 0);
    const paymentConfirmed =
        group.lines.length > 0 &&
        group.status !== 'PENDING' &&
        group.lines.every(
            (line) => line.status !== 'PENDING' && (line.status !== 'CANCELLED' || Boolean(line.invoiceNumber)),
        );
    return { refundedCents, remainingCents: Math.max(0, group.amountChargedCents - refundedCents), paymentConfirmed };
}
