'use client';

import { useSubscriptionState } from '@lumiris/api-client/react';

import { useAuthStore } from './auth-store';
import { subscriptionAccess } from './subscription-sale-state';

// Expose l’abonnement et son état de vérification.
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

        atelierPlus: query.data?.subscription?.atelierPlus ?? false,
    };
}
