import type { CartIntentRequest } from '@lumiris/api-client';
import type { CartItemDetail, PurchasedLine } from '@/lib/marketplace/cart-model';
import type { ShippingAddress } from '@/lib/marketplace/shipping-address';

export interface CheckoutContext {
    buyerId: string;
    lines: readonly PurchasedLine[];
    address: ShippingAddress;
}

// Identifie le paiement par compte, articles et adresse.
export function checkoutContextKey(context: CheckoutContext): string {
    const lines = context.lines
        .map((line) => `${line.productId}:${line.variantId ?? ''}:${line.quantity}`)
        .sort()
        .join('|');
    const { fullName, line1, line2, postalCode, city, country, phone } = context.address;
    const address = [fullName, line1, line2, postalCode, city, country, phone].map((part) => part ?? '').join('\u001f');
    return `${context.buyerId}#${lines}#${address}`;
}

// Extrait l’identifiant de paiement du secret client.
export function paymentIntentIdOf(clientSecret: string): string {
    const end = clientSecret.indexOf('_secret_');
    return end > 0 ? clientSecret.slice(0, end) : clientSecret;
}

interface CheckoutContextInput {
    onPaymentStep: boolean;
    address: ShippingAddress | null;
    buyerId: string | null;
    hasBlockingIssue: boolean;
    items: ReadonlyArray<Pick<CartItemDetail, 'product' | 'variant' | 'quantity'>>;
}

// Prépare le contexte de paiement lorsque ses conditions sont réunies.
export function checkoutContextOf(input: CheckoutContextInput): CheckoutContext | null {
    const { onPaymentStep, address, buyerId, hasBlockingIssue, items } = input;
    if (!onPaymentStep || !address || !buyerId || hasBlockingIssue || items.length === 0) return null;
    return {
        buyerId,
        lines: items.map((it) => ({ productId: it.product.id, variantId: it.variant.id, quantity: it.quantity })),
        address,
    };
}

// Prépare les articles et l’adresse de la demande de paiement.
export function cartIntentRequestOf(context: CheckoutContext): CartIntentRequest {
    return {
        items: context.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            ...(line.variantId ? { variantId: line.variantId } : {}),
        })),
        shipping: context.address,
    };
}
