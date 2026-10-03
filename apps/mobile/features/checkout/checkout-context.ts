// Contexte d'un paiement : acheteur, lignes exactes du panier et adresse. Deux contextes différents
// ne partagent jamais un PaymentIntent. Calcul pur, testé avec Bun.

import type { PurchasedLine, ShippingAddress } from '@/lib/marketplace';

export interface CheckoutContext {
    buyerId: string;
    lines: readonly PurchasedLine[];
    address: ShippingAddress;
}

/** Clé du contexte : change dès que l'acheteur, une ligne, une quantité ou l'adresse change. */
export function checkoutContextKey(context: CheckoutContext): string {
    const lines = context.lines
        .map((line) => `${line.productId}:${line.variantId ?? ''}:${line.quantity}`)
        .sort()
        .join('|');
    const { fullName, line1, line2, postalCode, city, country, phone } = context.address;
    const address = [fullName, line1, line2, postalCode, city, country, phone].map((part) => part ?? '').join('\u001f');
    return `${context.buyerId}#${lines}#${address}`;
}

/** Identifiant du PaymentIntent porté par son client secret (`pi_…_secret_…`). */
export function paymentIntentIdOf(clientSecret: string): string {
    const end = clientSecret.indexOf('_secret_');
    return end > 0 ? clientSecret.slice(0, end) : clientSecret;
}
