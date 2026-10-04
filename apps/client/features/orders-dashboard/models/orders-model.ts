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

// Décrit le versement sans promettre des fonds annulés ou remboursés.
export function orderFundsText(order: SellerOrder): string {
    const refunded = order.refundedCents ?? 0;
    const total = order.amountTotalCents + (order.shippingCents ?? 0);
    if (refunded > 0) {
        const kind = refunded >= total ? 'intégralement' : 'partiellement';
        return `Acheteur ${kind} remboursé. ${order.released ? 'Un versement initial a été effectué ; consultez la trésorerie pour les mouvements de reprise.' : 'Aucun versement effectué. Consultez la trésorerie pour le solde après remboursement.'}`;
    }
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
        return 'Commande clôturée. Aucun versement futur annoncé ; consultez la trésorerie pour les mouvements enregistrés.';
    }
    return order.released
        ? 'Fonds versés.'
        : 'Fonds retenus par Lumiris jusqu’à la livraison — ils partent automatiquement ensuite.';
}
