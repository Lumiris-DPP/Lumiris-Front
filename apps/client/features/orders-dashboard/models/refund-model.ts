import { isApiError, type SellerOrder } from '@lumiris/api-client';

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

// Longueur maximale du motif acceptée par le serveur (RefundRequest, @Size(max = 2000)).
export const REFUND_REASON_MAX_LENGTH = 2000;

// Statuts d'un refus serveur : la demande n'a eu aucun effet et serait refusée à l'identique.
const REFUSED_STATUSES: ReadonlySet<number> = new Set([400, 403, 404, 422]);

// Décide la suite d'un échec : un refus libère l'intention et montre son motif, une issue incertaine la garde.
export function refundFailureOf(error: unknown): { release: boolean; message: string } {
    if (isApiError(error) && REFUSED_STATUSES.has(error.status)) return { release: true, message: error.message };
    return { release: false, message: 'Réponse non confirmée. Reprenez la même opération pour vérifier son résultat.' };
}
