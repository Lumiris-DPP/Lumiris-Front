import { isApiError, type SellerOrder } from '@lumiris/api-client';

// Calcule le montant restant remboursable.
export function refundableCents(order: SellerOrder): number {
    return Math.max(0, order.amountTotalCents + (order.shippingCents ?? 0) - (order.refundedCents ?? 0));
}

// Lit le montant de remboursement en centimes.
export function parseRefundCents(value: string): number | null {
    const normalized = value.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
    const [euros = '0', cents = ''] = normalized.split('.');
    const amount = Number(euros) * 100 + Number(cents.padEnd(2, '0'));
    return Number.isSafeInteger(amount) ? amount : null;
}

export const REFUND_REASON_MAX_LENGTH = 2000;

const REFUSED_STATUSES: ReadonlySet<number> = new Set([400, 403, 404, 422]);

// Distingue un refus certain d’une réponse de remboursement incertaine.
export function refundFailureOf(error: unknown): { release: boolean; message: string } {
    if (isApiError(error) && REFUSED_STATUSES.has(error.status)) return { release: true, message: error.message };
    return { release: false, message: 'Réponse non confirmée. Reprenez la même opération pour vérifier son résultat.' };
}
