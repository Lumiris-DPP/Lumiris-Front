import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import { sellerOrderSchema, type ReasonInput, type SellerOrder } from '../types/orders';

const disputeListSchema = z.array(sellerOrderSchema);

// `refundCents` renseigné ⇒ tranché en faveur de l'acheteur ; absent ⇒ clos sans remboursement.
export interface DisputeResolutionInput {
    resolution: string;
    refundCents?: number;
}

// LUMIRIS-24 · Arbitrage des litiges par la plateforme (ADMIN). La vue reprend le DTO vendeur :
// l'arbitre a besoin exactement des mêmes éléments (montants, adresse, suivi, historique).
export function disputesApi(http: Http) {
    return {
        async listOpen(): Promise<SellerOrder[]> {
            return parseOr(disputeListSchema, await http.request('/api/admin/disputes'));
        },
        // L'arbitre écrit dans le fil de la commande, lu par les deux parties au même endroit.
        postMessage(orderId: string, input: ReasonInput): Promise<void> {
            return http.request<void>(`/api/admin/disputes/${orderId}/messages`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
        resolve(orderId: string, input: DisputeResolutionInput): Promise<void> {
            return http.request<void>(`/api/admin/disputes/${orderId}/resolve`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
    };
}
