'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '@lumiris/api-client/react';
import type { PaymentIntentResponse } from '@lumiris/api-client';
import { rememberPurchase } from '@/lib/marketplace/cart-storage';
import {
    cartIntentRequestOf,
    checkoutContextKey,
    paymentIntentIdOf,
    type CheckoutContext,
} from '../models/checkout-context';
import { createIntentCache } from '../models/intent-cache';

const intents = createIntentCache<PaymentIntentResponse>();

// Vide le cache des intentions de paiement.
export function resetCheckoutIntents(): void {
    intents.clear();
}

interface IntentState {
    attempt: number;
    key: string;
    request: Promise<PaymentIntentResponse>;
    intent: PaymentIntentResponse | null;
    error: unknown;
}

// Charge l’intention du contexte courant et ignore les réponses périmées.
export function useCheckoutIntent(context: CheckoutContext | null): {
    intent: PaymentIntentResponse | null;
    error: unknown;
    retry: () => void;
} {
    const client = useApiClient();
    const [state, setState] = useState<IntentState | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!context) return;
        const key = checkoutContextKey(context);
        const request = intents.get(key, () => client.marketplace.checkoutIntent(cartIntentRequestOf(context)));
        let cancelled = false;
        request.then(
            (intent) => {
                const paymentIntentId = paymentIntentIdOf(intent.clientSecret);
                if (paymentIntentId) rememberPurchase(paymentIntentId, context.lines, context.buyerId);
                if (!cancelled) setState({ attempt, key, request, intent, error: null });
            },
            (error: unknown) => {
                intents.forget(request);
                if (!cancelled) setState({ attempt, key, request, intent: null, error });
            },
        );
        return () => {
            cancelled = true;
        };
    }, [context, client, attempt]);

    const key = context ? checkoutContextKey(context) : null;
    const active = key ? intents.peek(key) : null;
    const current =
        state &&
        state.attempt === attempt &&
        state.key === key &&
        (state.error ? active === null : state.request === active)
            ? state
            : null;
    return {
        intent: current?.intent ?? null,
        error: current?.error ?? null,
        retry: () => setAttempt((n) => n + 1),
    };
}
