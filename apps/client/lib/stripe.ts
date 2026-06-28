import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Cached per key so Stripe.js loads at most once.
const cache = new Map<string, Promise<Stripe | null>>();

export function getStripe(publishableKey: string): Promise<Stripe | null> {
    let promise = cache.get(publishableKey);
    if (!promise) {
        promise = loadStripe(publishableKey);
        cache.set(publishableKey, promise);
    }
    return promise;
}
