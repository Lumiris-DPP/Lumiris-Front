import type { SellerOrder, SellerOrderTab } from '@lumiris/api-client';
import { sellerOrderTab } from '@lumiris/api-client';

// Répartit les commandes sans modifier leur ordre ni leurs propriétés.
export function groupByTab(orders: readonly SellerOrder[]): Record<SellerOrderTab, SellerOrder[]> {
    const grouped: Record<SellerOrderTab, SellerOrder[]> = {
        TO_SHIP: [],
        SHIPPED: [],
        RETURNS: [],
        DISPUTES: [],
        CLOSED: [],
    };
    for (const order of orders) {
        grouped[sellerOrderTab(order.status, order.disputeStatus)].push(order);
    }
    return grouped;
}

// Exclut du total retenu les fonds déjà versés et les ventes annulées ou remboursées.
export function heldOrderCents(order: SellerOrder): number {
    return order.released || order.status === 'REFUNDED' || order.status === 'CANCELLED' ? 0 : order.netCents;
}

type FundsState = 'refunded-fully' | 'refunded-partially' | 'closed' | 'released' | 'held';

// Classe les fonds d'une commande une seule fois, pour la colonne comme pour le détail.
function fundsStateOf(order: SellerOrder): FundsState {
    const refunded = order.refundedCents ?? 0;
    if (refunded > 0) {
        return refunded >= order.amountTotalCents + (order.shippingCents ?? 0)
            ? 'refunded-fully'
            : 'refunded-partially';
    }
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return 'closed';
    return order.released ? 'released' : 'held';
}

const FUNDS_LABEL = {
    'refunded-fully': 'Acheteur intégralement remboursé',
    'refunded-partially': 'Acheteur partiellement remboursé',
    closed: 'Commande clôturée',
    released: 'versé',
    held: 'retenu',
} satisfies Record<FundsState, string>;

// Donne le libellé court de la colonne des fonds.
export function orderFundsLabel(order: SellerOrder): string {
    return FUNDS_LABEL[fundsStateOf(order)];
}

// Décrit le versement sans promettre des fonds annulés ou remboursés.
export function orderFundsText(order: SellerOrder): string {
    const state = fundsStateOf(order);
    if (state === 'refunded-fully' || state === 'refunded-partially') {
        return `${FUNDS_LABEL[state]}. ${order.released ? 'Un versement initial a été effectué ; consultez la trésorerie pour les mouvements de reprise.' : 'Aucun versement effectué. Consultez la trésorerie pour le solde après remboursement.'}`;
    }
    if (state === 'closed') {
        return `${FUNDS_LABEL.closed}. Aucun versement futur annoncé ; consultez la trésorerie pour les mouvements enregistrés.`;
    }
    return state === 'released'
        ? 'Fonds versés.'
        : 'Fonds retenus par Lumiris jusqu’à la livraison — ils partent automatiquement ensuite.';
}
