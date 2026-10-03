'use client';

// Coordination du paiement : prépare le PaymentIntent du contexte courant (acheteur, panier,
// adresse) et ne rend QUE la réponse de la requête en cours pour ce contexte. Un changement de compte,
// de panier ou d'adresse rend l'ancienne réponse inutilisable ; un retour à un contexte déjà vu
// redemande l'intention au serveur, qui remet l'adresse à jour ou en crée une neuve.

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

// Une seule intention en mémoire, celle du contexte courant. La clé porte l'acheteur : deux comptes
// sur le même navigateur ne partagent jamais une entrée.
const intents = createIntentCache<PaymentIntentResponse>();

/** Oublie les PaymentIntents préparés : après un paiement, le même panier repart d'une tentative neuve. */
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

/** PaymentIntent du contexte donné (ou `null` tant qu'aucun contexte n'est prêt), avec sa relance. */
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
                rememberPurchase(paymentIntentIdOf(intent.clientSecret), context.lines, context.buyerId);
                if (!cancelled) setState({ attempt, key, request, intent, error: null });
            },
            (error: unknown) => {
                // Un échec n'est pas resservi : renvoyer le même contexte redemande l'intention.
                intents.forget(request);
                if (!cancelled) setState({ attempt, key, request, intent: null, error });
            },
        );
        return () => {
            cancelled = true;
        };
    }, [context, client, attempt]);

    // Seule la réponse de la requête que le cache détient pour ce contexte est rendue : ni celle d'un
    // autre contexte, ni une ancienne réponse du même contexte remplacée entre-temps. Un échec reste
    // affiché tant qu'aucune requête plus récente n'est partie pour ce contexte.
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
