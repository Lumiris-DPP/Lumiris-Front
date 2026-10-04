'use client';

import { useEffect, useState } from 'react';

import { isApiError, useMyOrders, useOrderGroup, useWardrobe } from '@lumiris/api-client/react';

import { useUser } from '@/lib/auth/use-user';
import { settlePurchase } from '@/lib/marketplace/cart-storage';
import { confirmationView } from '../models/confirmation-view';

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_MS = 30_000;

// Suit la confirmation du paiement avec une attente bornée.
export function useOrderConfirmation(routeId: string, piFromQuery: string | null) {
    const { user, isAuthenticated } = useUser();

    const [startedAt] = useState(() => Date.now());
    const [pollExpired, setPollExpired] = useState(false);

    const explicitPi = piFromQuery ?? (routeId && routeId !== 'latest' ? routeId : null);

    useEffect(() => {
        if (!isAuthenticated) return;
        const timer = setTimeout(() => setPollExpired(true), POLL_MAX_MS);
        return () => clearTimeout(timer);
    }, [isAuthenticated]);

    const {
        data: orders,
        error: ordersError,
        refetch: refetchOrders,
    } = useMyOrders({
        enabled: isAuthenticated && !explicitPi,
        refetchInterval: (query) => {
            if (query.state.data?.[0]?.paymentIntentId) return false;
            if (Date.now() - startedAt > POLL_MAX_MS) return false;
            return POLL_INTERVAL_MS;
        },
    });
    const targetPi = explicitPi ?? orders?.[0]?.paymentIntentId ?? null;

    const {
        data: group,
        error: groupError,
        refetch: refetchGroup,
    } = useOrderGroup(targetPi, {
        enabled: isAuthenticated && Boolean(targetPi),
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status && status !== 'PENDING') return false;
            if (Date.now() - startedAt > POLL_MAX_MS) return false;
            return POLL_INTERVAL_MS;
        },
    });
    const { data: wardrobe = [] } = useWardrobe(user?.id ?? null, { enabled: isAuthenticated });

    const failure = groupError ?? (explicitPi ? null : ordersError);
    const view = confirmationView({
        isAuthenticated,
        targetPaymentIntentId: targetPi,
        noRecentOrder: orders !== undefined && !targetPi,
        group,
        failureStatus: failure ? (isApiError(failure) ? failure.status : 0) : null,
        timedOut: pollExpired,
    });

    useEffect(() => {
        if (view === 'confirmed' && group) settlePurchase(group.paymentIntentId);
    }, [view, group]);

    return { view, group, targetPi, wardrobe, refetchGroup, refetchOrders };
}
