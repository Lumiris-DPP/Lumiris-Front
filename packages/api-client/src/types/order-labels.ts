import type { DisputeStatus, OrderEventType, OrderStatus, SellerOrderTab } from './orders';

// Vocabulaire du cycle de vie d'une commande, partagé par ATELIER et VISION. Il vit à côté des
// unions dont il est indexé : un état ajouté au backend casse la compilation ici tant que son
// libellé manque, ce qu'un dictionnaire recopié dans chaque app ne garantirait pas.
//
// Le même état ne se raconte pas pareil des deux côtés : « à expédier » pour l'atelier est « en
// préparation » pour l'acheteur. D'où deux dictionnaires, pas un seul avec des exceptions.

export const ORDER_STATUS_LABEL_BUYER: Record<OrderStatus, string> = {
    PENDING: 'Paiement en cours',
    PAID: 'En préparation',
    SHIPPED: 'En route',
    DELIVERED: 'Livrée',
    COMPLETED: 'Terminée',
    RETURN_REQUESTED: 'Retour demandé',
    RETURN_APPROVED: 'Retour accepté',
    RETURN_REFUSED: 'Retour refusé',
    RETURN_RECEIVED: 'Retour reçu',
    REFUNDED: 'Remboursée',
    CANCELLED: 'Annulée',
};

export const ORDER_STATUS_LABEL_SELLER: Record<OrderStatus, string> = {
    PENDING: 'Paiement en attente',
    PAID: 'À expédier',
    SHIPPED: 'Expédiée',
    DELIVERED: 'Livrée',
    COMPLETED: 'Clôturée',
    RETURN_REQUESTED: 'Retour à traiter',
    RETURN_APPROVED: 'Retour accepté',
    RETURN_REFUSED: 'Retour refusé',
    RETURN_RECEIVED: 'Retour reçu',
    REFUNDED: 'Remboursée',
    CANCELLED: 'Annulée',
};

// Ton visuel de l'état : neutre (rien à faire), à faire (attend une action), succès, alerte.
export type OrderStatusTone = 'neutral' | 'pending' | 'success' | 'warning';

export const ORDER_STATUS_TONE: Record<OrderStatus, OrderStatusTone> = {
    PENDING: 'pending',
    PAID: 'pending',
    SHIPPED: 'neutral',
    DELIVERED: 'success',
    COMPLETED: 'success',
    RETURN_REQUESTED: 'warning',
    RETURN_APPROVED: 'warning',
    RETURN_REFUSED: 'warning',
    RETURN_RECEIVED: 'warning',
    REFUNDED: 'neutral',
    CANCELLED: 'neutral',
};

export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = {
    NONE: '',
    OPEN: 'Litige ouvert',
    RESOLVED: 'Litige tranché',
    REJECTED: 'Litige clos',
};

export const ORDER_EVENT_LABEL: Record<OrderEventType, string> = {
    ORDER_PLACED: 'Commande passée',
    PAYMENT_CONFIRMED: 'Paiement confirmé',
    SHIPPED: 'Colis expédié',
    DELIVERED: 'Colis livré',
    COMPLETED: 'Commande clôturée',
    RETURN_REQUESTED: 'Retour demandé',
    RETURN_APPROVED: 'Retour accepté',
    RETURN_REFUSED: 'Retour refusé',
    RETURN_RECEIVED: 'Retour réceptionné',
    REFUNDED: 'Remboursement émis',
    DISPUTE_OPENED: 'Litige ouvert',
    DISPUTE_RESOLVED: 'Litige tranché',
    DISPUTE_REJECTED: 'Litige clos sans suite',
    CANCELLED: 'Commande annulée',
    FUNDS_RELEASED: 'Fonds versés à l’atelier',
    MESSAGE: 'Message',
};

export const SELLER_ORDER_TAB_LABEL: Record<SellerOrderTab, string> = {
    TO_SHIP: 'À expédier',
    SHIPPED: 'Expédiées',
    RETURNS: 'Retours',
    DISPUTES: 'Litiges',
    CLOSED: 'Clôturées',
};

// Ordre d'affichage des onglets : les deux premiers portent le travail quotidien, les deux
// suivants les exceptions, le dernier l'archive.
export const SELLER_ORDER_TABS: readonly SellerOrderTab[] = ['TO_SHIP', 'SHIPPED', 'RETURNS', 'DISPUTES', 'CLOSED'];

// Onglet du tableau de bord vendeur auquel une commande appartient. Un litige ouvert prime sur
// tout : c'est le seul état qui exige une réponse hors du flux logistique normal.
export function sellerOrderTab(status: OrderStatus, disputeStatus: DisputeStatus): SellerOrderTab {
    if (disputeStatus === 'OPEN') return 'DISPUTES';
    switch (status) {
        case 'PAID':
            return 'TO_SHIP';
        case 'SHIPPED':
        case 'DELIVERED':
            return 'SHIPPED';
        case 'RETURN_REQUESTED':
        case 'RETURN_APPROVED':
        case 'RETURN_REFUSED':
        case 'RETURN_RECEIVED':
            return 'RETURNS';
        default:
            return 'CLOSED';
    }
}

// Étapes du fil de suivi montré à l'acheteur. Une commande qui bifurque (retour, litige,
// remboursement) sort de ce rail : la timeline d'événements prend alors le relais.
export const BUYER_TRACKING_STEPS: readonly OrderStatus[] = ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

export function trackingStepIndex(status: OrderStatus): number {
    return BUYER_TRACKING_STEPS.indexOf(status);
}
