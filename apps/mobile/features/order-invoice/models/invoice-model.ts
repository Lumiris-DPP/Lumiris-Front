import type { OrderGroup } from '@lumiris/api-client';

export function formatInvoiceDate(iso?: string | null): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

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
