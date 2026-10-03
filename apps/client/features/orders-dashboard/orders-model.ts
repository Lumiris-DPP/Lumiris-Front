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
