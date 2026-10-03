import type { SellerOrder } from '@lumiris/api-client';

// Calcule le reliquat remboursable, livraison comprise, comme le serveur.
export function refundableCents(order: SellerOrder): number {
    return Math.max(0, order.amountTotalCents + (order.shippingCents ?? 0) - (order.refundedCents ?? 0));
}

// Convertit une saisie décimale en centimes sans arrondir une fraction de centime.
export function parseRefundCents(value: string): number | null {
    const normalized = value.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
    const [euros = '0', cents = ''] = normalized.split('.');
    const amount = Number(euros) * 100 + Number(cents.padEnd(2, '0'));
    return Number.isSafeInteger(amount) ? amount : null;
}
