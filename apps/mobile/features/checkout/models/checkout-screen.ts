// Écran du tunnel à montrer, déduit de l'état du panier, de la session et de la préparation du
// paiement. Calcul pur, testé avec Bun : l'écran ne fait qu'afficher la décision.

import { isApiError } from '@lumiris/api-client';
import type { CartLoadState } from '@/lib/marketplace/cart-model';

type CheckoutScreen =
    | { kind: 'empty' }
    | { kind: 'sign-in' }
    | { kind: 'loading' }
    | { kind: 'load-error' }
    | { kind: 'cart-changed' }
    | { kind: 'refused'; message: string }
    | { kind: 'payment-down' }
    | { kind: 'steps' };

interface CheckoutScreenInput {
    loadState: CartLoadState;
    /** Lignes du panier local, avant relecture du catalogue. */
    lineCount: number;
    isAuthenticated: boolean;
    hasBlockingIssue: boolean;
    /** Échec de la préparation du PaymentIntent, `null` sans échec. */
    intentError: unknown;
}

// Refus métier du serveur : son message dit à l'acheteur quoi corriger (stock, atelier, taille).
const REFUSAL_CODES: readonly string[] = ['VALIDATION_ERROR', 'NOT_FOUND'];

/** Choisit l'écran du tunnel ; seul un panier relu, sans problème, d'un acheteur connecté se paie. */
export function checkoutScreenOf(input: CheckoutScreenInput): CheckoutScreen {
    if (input.loadState === 'ready' && input.lineCount === 0) return { kind: 'empty' };
    // Un invité se connecte avant de payer ; son panier est conservé et fusionné au retour.
    if (!input.isAuthenticated) return { kind: 'sign-in' };
    if (input.loadState === 'loading') return { kind: 'loading' };
    if (input.loadState === 'error') return { kind: 'load-error' };
    if (input.hasBlockingIssue) return { kind: 'cart-changed' };
    if (input.intentError) {
        const error = input.intentError;
        return isApiError(error) && REFUSAL_CODES.includes(error.code)
            ? { kind: 'refused', message: error.message }
            : { kind: 'payment-down' };
    }
    return { kind: 'steps' };
}
