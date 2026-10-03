'use client';

// Coordination du paiement : prépare le PaymentIntent du contexte courant (acheteur, panier,
// adresse) et ne rend QUE la réponse obtenue pour ce contexte. Un changement de compte, de panier
// ou d'adresse pendant l'étape de paiement rend l'ancienne réponse inutilisable : l'écran attend
// alors le PaymentIntent du nouveau contexte, et le serveur annule l'ancien.

import { useEffect, useState } from 'react';
import { useApiClient } from '@lumiris/api-client/react';
import type { PaymentIntentResponse } from '@lumiris/api-client';
import { rememberPurchase } from '@/lib/marketplace';
import { checkoutContextKey, paymentIntentIdOf, type CheckoutContext } from './checkout-context';

// Dédoublonne la création à travers les remounts StrictMode et les allers-retours entre les étapes.
// La clé porte l'acheteur : deux comptes sur le même navigateur ne partagent jamais une entrée.
const intentCache = new Map<string, Promise<PaymentIntentResponse>>();

/** Oublie les PaymentIntents préparés : après un paiement, le même panier repart d'une tentative neuve. */
export function resetCheckoutIntents(): void {
    intentCache.clear();
}

interface IntentState {
    key: string;
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
        let promise = intentCache.get(key);
        if (!promise) {
            promise = client.marketplace.checkoutIntent({
                items: context.lines.map((line) => ({
                    productId: line.productId,
                    quantity: line.quantity,
                    ...(line.variantId ? { variantId: line.variantId } : {}),
                })),
                shipping: context.address,
            });
            intentCache.set(key, promise);
        }
        let cancelled = false;
        promise.then(
            (intent) => {
                rememberPurchase(paymentIntentIdOf(intent.clientSecret), context.lines);
                if (!cancelled) setState({ key, intent, error: null });
            },
            (error: unknown) => {
                intentCache.delete(key);
                if (!cancelled) setState({ key, intent: null, error });
            },
        );
        return () => {
            cancelled = true;
        };
    }, [context, client, attempt]);

    // Une réponse obtenue pour un autre contexte n'est jamais rendue.
    const current = context && state?.key === checkoutContextKey(context) ? state : null;
    return {
        intent: current?.intent ?? null,
        error: current?.error ?? null,
        retry: () => setAttempt((n) => n + 1),
    };
}
