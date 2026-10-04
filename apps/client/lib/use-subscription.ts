'use client';

import { useSubscriptionState } from '@lumiris/api-client/react';

import { useAuthStore } from './auth-store';
import { subscriptionSaleState } from './subscription-sale-state';

// Live subscription + quota for the signed-in artisan; only enabled with a token.
export function useSubscription() {
    const token = useAuthStore((s) => s.token);
    const query = useSubscriptionState({ enabled: Boolean(token) });
    const saleState = subscriptionSaleState(query.isError, query.isSuccess, query.data?.hasActiveSubscription ?? false);
    return {
        ...query,
        saleState,
        state: query.data ?? null,
        subscription: query.data?.subscription ?? null,
        quota: query.data?.quota ?? null,
        hasActiveSubscription: saleState === 'active',
        hasLiveSubscription: query.data?.hasLiveSubscription ?? false,
        // ATELIER+ add-on actif (2ᵉ article Stripe) — imbriqué dans `subscription` côté backend.
        atelierPlus: query.data?.subscription?.atelierPlus ?? false,
    };
}
