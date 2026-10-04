import type { OrderGroup, OrderStatus } from '@lumiris/api-client';

import { isPaidOrderStatus } from '@/lib/marketplace/cart-model';

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

    targetPaymentIntentId: string | null;

    noRecentOrder: boolean;
    group: Pick<OrderGroup, 'status'> | undefined;

    failureStatus: number | null;

    timedOut: boolean;
}

export function confirmationView(input: ConfirmationInput): ConfirmationView {
    if (!input.isAuthenticated) return 'signed-out';
    if (input.group) {
        if (input.group.status === 'PENDING') return input.timedOut ? 'pending-timeout' : 'pending';
        return isPaidOrderStatus(input.group.status) ? 'confirmed' : 'unwound';
    }
    if (input.failureStatus !== null) return input.failureStatus === 404 ? 'not-found' : 'error';
    if (!input.targetPaymentIntentId) return input.noRecentOrder ? 'no-order' : input.timedOut ? 'error' : 'resolving';
    return input.timedOut ? 'error' : 'resolving';
}

export function confirmationTotalLabel(status: OrderStatus): string {
    if (status === 'PENDING') return 'Total à confirmer';
    if (status === 'CANCELLED') return 'Total de la commande annulée';

    return 'Total payé';
}

export function confirmationRefundFacts(group: Pick<OrderGroup, 'lines' | 'amountChargedCents'>) {
    const refundedCents = group.lines.reduce((sum, line) => sum + (line.refundedCents ?? 0), 0);
    const closed =
        group.lines.length > 0 &&
        group.lines.every((line) => line.status === 'CANCELLED' || line.status === 'REFUNDED');
    return {
        refundedCents,
        message:
            refundedCents > 0
                ? `Un remboursement ${refundedCents >= group.amountChargedCents ? 'total' : 'partiel'} a été émis vers ton moyen de paiement. Le montant remboursé figure ci-dessus.`
                : closed
                  ? 'Cette commande est clôturée. Aucun remboursement n’est enregistré ; consulte son suivi pour le détail du paiement.'
                  : null,
    };
}
