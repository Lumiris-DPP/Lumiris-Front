'use client';

import { useEffect, useState } from 'react';

import { isApiError, useMyOrders, useOrderGroup, useWardrobe } from '@lumiris/api-client/react';

import { useUser } from '@/lib/auth/use-user';
import { settlePurchase } from '@/lib/marketplace/cart-storage';
import { confirmationView } from '../models/confirmation-view';

// Cadence de poll + borne dure : au-delà, on cesse d'attendre le webhook Stripe.
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_MS = 30_000;

/** Relit le paiement serveur et retire seulement ses lignes confirmées du panier. */
export function useOrderConfirmation(routeId: string, piFromQuery: string | null) {
    const { user, isAuthenticated } = useUser();

    const [startedAt] = useState(() => Date.now());
    const [pollExpired, setPollExpired] = useState(false);

    // paymentIntentId cible : la query de retour de redirection Stripe (?payment_intent=…)
    // prime sur le segment d'URL ; « latest » signifie « à résoudre via la dernière commande ».

    const explicitPi = piFromQuery ?? (routeId && routeId !== 'latest' ? routeId : null);

    // Borne dure du polling : au-delà de ~30 s, on montre un repli plutôt qu'un spinner infini.
    useEffect(() => {
        if (!isAuthenticated) return;
        const timer = setTimeout(() => setPollExpired(true), POLL_MAX_MS);
        return () => clearTimeout(timer);
    }, [isAuthenticated]);

    // Repli « latest » : sans PaymentIntent explicite (lien legacy / retour sans query), on lit
    // la commande la plus récente pour en déduire son paymentIntentId.
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

    // Groupe de commande = toutes les lignes du paiement + total RÉELLEMENT facturé par Stripe.
    // Passe à PAID via le webhook → on poll jusqu'à résolution ou borne de temps atteinte.
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

    // Le panier ne perd que les lignes de CE paiement, et seulement une fois le paiement confirmé.
    useEffect(() => {
        if (view === 'confirmed' && group) settlePurchase(group.paymentIntentId);
    }, [view, group]);

    return { view, group, targetPi, wardrobe, refetchGroup, refetchOrders };
}
