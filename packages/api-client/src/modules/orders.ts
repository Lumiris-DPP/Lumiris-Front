import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import {
    orderDetailSchema,
    orderGroupSchema,
    orderResponseSchema,
    sellerOrderSchema,
    shippingAvailabilitySchema,
    shippingLabelSchema,
    type OrderDetail,
    type OrderGroup,
    type OrderResponse,
    type ReasonInput,
    type RefundInput,
    type ReturnDecisionInput,
    type SellerOrder,
    type ShipOrderInput,
    type ShippingAvailability,
    type ShippingLabel,
} from '../types/orders';

const orderListSchema = z.array(orderResponseSchema);
const sellerOrderListSchema = z.array(sellerOrderSchema);

// LUMIRIS-24 · Cycle de vie d'une commande marketplace. `orders` = côté acheteur (VISION),
// `sellerOrders` = côté vendeur (ATELIER). Toutes les mutations sont des transitions validées
// côté serveur : un 422 signifie « cette action n'est pas permise dans cet état ».
export function ordersApi(http: Http) {
    return {
        // ── Acheteur ────────────────────────────────────────────────────────
        async list(): Promise<OrderResponse[]> {
            return parseOr(orderListSchema, await http.request('/api/orders'));
        },
        async get(orderId: string): Promise<OrderDetail> {
            return parseOr(orderDetailSchema, await http.request(`/api/orders/${orderId}`));
        },
        // Regroupe toutes les lignes d'un même paiement et renvoie le total RÉELLEMENT facturé
        // par Stripe (articles + port de chaque atelier) — utilisé par l'écran de confirmation.
        async group(paymentIntentId: string): Promise<OrderGroup> {
            return parseOr(orderGroupSchema, await http.request(`/api/orders/group/${paymentIntentId}`));
        },
        confirmDelivery(orderId: string): Promise<void> {
            return http.request<void>(`/api/orders/${orderId}/received`, { method: 'POST', skipJson: true });
        },
        requestReturn(orderId: string, input: ReasonInput): Promise<void> {
            return http.request<void>(`/api/orders/${orderId}/return`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
        openDispute(orderId: string, input: ReasonInput): Promise<void> {
            return http.request<void>(`/api/orders/${orderId}/dispute`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
        // Fil de conversation avec l'atelier, ouvert à tout moment — pas seulement en litige.
        postMessage(orderId: string, input: ReasonInput): Promise<void> {
            return http.request<void>(`/api/orders/${orderId}/messages`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
        // Annulation avant expédition : remboursement intégral, la pièce retourne au catalogue.
        cancel(orderId: string, input: ReasonInput): Promise<void> {
            return http.request<void>(`/api/orders/${orderId}/cancel`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
    };
}

export function sellerOrdersApi(http: Http) {
    return {
        async list(): Promise<SellerOrder[]> {
            return parseOr(sellerOrderListSchema, await http.request('/api/seller/orders'));
        },
        async get(orderId: string): Promise<SellerOrder> {
            return parseOr(sellerOrderSchema, await http.request(`/api/seller/orders/${orderId}`));
        },
        // Saisie du suivi et marquage de l'expédition en une seule action : un colis sans numéro
        // de suivi ne serait pas suivable par l'acheteur.
        ship(orderId: string, input: ShipOrderInput): Promise<void> {
            return http.request<void>(`/api/seller/orders/${orderId}/ship`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
        // État de l'intégration transporteur, lu AVANT d'afficher le bouton d'impression.
        async shipping(): Promise<ShippingAvailability> {
            return parseOr(shippingAvailabilitySchema, await http.request('/api/seller/orders/shipping'));
        },
        // Étiquette en un clic : bordereau fabriqué depuis l'adresse déjà stockée sur la commande,
        // suivi rempli, commande passée en expédiée sans saisie. `ship` ci-dessus reste le chemin
        // d'une remise en main propre ou d'un transporteur hors agrégateur.
        async generateLabel(orderId: string): Promise<ShippingLabel> {
            return parseOr(
                shippingLabelSchema,
                await http.request(`/api/seller/orders/${orderId}/label`, { method: 'POST' }),
            );
        },
        decideReturn(orderId: string, input: ReturnDecisionInput): Promise<void> {
            return http.request<void>(`/api/seller/orders/${orderId}/return/decision`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
        markReturnReceived(orderId: string): Promise<void> {
            return http.request<void>(`/api/seller/orders/${orderId}/return/received`, {
                method: 'POST',
                skipJson: true,
            });
        },
        refund(orderId: string, input: RefundInput): Promise<void> {
            return http.request<void>(`/api/seller/orders/${orderId}/refund`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
        // Même fil de conversation que côté acheteur, vu de l'atelier.
        postMessage(orderId: string, input: ReasonInput): Promise<void> {
            return http.request<void>(`/api/seller/orders/${orderId}/messages`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
        // Annulation avant expédition (rupture, pièce abîmée) : l'acheteur est intégralement remboursé.
        cancel(orderId: string, input: ReasonInput): Promise<void> {
            return http.request<void>(`/api/seller/orders/${orderId}/cancel`, {
                method: 'POST',
                body: input,
                skipJson: true,
            });
        },
    };
}
