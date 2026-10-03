// Ce que l'écran de confirmation a le droit d'affirmer, déduit uniquement de l'état serveur : ni
// l'URL, ni le retour de Stripe.js ne prouvent qu'une commande est payée. Calcul pur, testé avec Bun.

import type { OrderGroup } from '@lumiris/api-client';

type ConfirmationView =
    | 'signed-out'
    | 'resolving'
    | 'no-order'
    | 'not-found'
    | 'error'
    | 'pending'
    | 'pending-timeout'
    | 'confirmed'
    | 'unwound';

export interface ConfirmationInput {
    isAuthenticated: boolean;
    /** PaymentIntent visé, ou `null` tant que la dernière commande n'est pas connue. */
    targetPaymentIntentId: string | null;
    /** Vrai quand la lecture des commandes a abouti sans aucune commande payable. */
    noRecentOrder: boolean;
    group: Pick<OrderGroup, 'status'> | undefined;
    /** Statut HTTP de la lecture en échec (0 = réseau), `null` sans échec. */
    failureStatus: number | null;
    /** Vrai une fois la borne d'attente du webhook dépassée. */
    timedOut: boolean;
}

/** Vue à afficher : seule une commande relue en état payé autorise « Commande confirmée ». */
export function confirmationView(input: ConfirmationInput): ConfirmationView {
    if (!input.isAuthenticated) return 'signed-out';
    if (input.group) {
        if (input.group.status === 'PENDING') return input.timedOut ? 'pending-timeout' : 'pending';
        if (input.group.status === 'CANCELLED' || input.group.status === 'REFUNDED') return 'unwound';
        return 'confirmed';
    }
    if (input.failureStatus !== null) return input.failureStatus === 404 ? 'not-found' : 'error';
    if (!input.targetPaymentIntentId) return input.noRecentOrder ? 'no-order' : input.timedOut ? 'error' : 'resolving';
    return input.timedOut ? 'error' : 'resolving';
}
