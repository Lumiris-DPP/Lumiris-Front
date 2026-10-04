'use client';

import { useSubscriptionState } from '@lumiris/api-client/react';

import { useAuthStore } from './auth-store';
import { subscriptionAccess } from './subscription-sale-state';

// Live subscription + quota for the signed-in artisan; only enabled with a token.
export function useSubscription() {
    const token = useAuthStore((s) => s.token);
    const query = useSubscriptionState({ enabled: Boolean(token) });
    return {
        ...query,
        ...subscriptionAccess(query),
        state: query.data ?? null,
        subscription: query.data?.subscription ?? null,
        quota: query.data?.quota ?? null,
        hasLiveSubscription: query.data?.hasLiveSubscription ?? false,
        // ATELIER+ add-on actif (2ᵉ article Stripe) — imbriqué dans `subscription` côté backend.
        atelierPlus: query.data?.subscription?.atelierPlus ?? false,
    };
}
