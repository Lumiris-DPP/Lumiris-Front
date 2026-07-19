import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Stripe.js chargé au plus une fois par clé publiable (renvoyée par le PaymentIntent).
// Le paiement marketplace est EMBARQUÉ (Payment Element) — aucune redirection.
const cache = new Map<string, Promise<Stripe | null>>();

export function getStripe(publishableKey: string): Promise<Stripe | null> {
    let promise = cache.get(publishableKey);
    if (!promise) {
        promise = loadStripe(publishableKey);
        cache.set(publishableKey, promise);
    }
    return promise;
}
