import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import { wardrobeItemDtoSchema, type WardrobeItemDto } from '../types/wardrobe';
import {
    orderGroupSchema,
    orderResponseSchema,
    type OrderGroup,
    type OrderResponse,
} from '../types/marketplace';

const wardrobeListSchema = z.array(wardrobeItemDtoSchema);
const orderListSchema = z.array(orderResponseSchema);

// LUMIRIS-22 · Garde-Robe de l'acheteur (pièces achetées en direct in-app) + ses commandes.
export function wardrobeApi(http: Http) {
    return {
        async list(): Promise<WardrobeItemDto[]> {
            return parseOr(wardrobeListSchema, await http.request('/api/wardrobe'));
        },
        async orders(): Promise<OrderResponse[]> {
            return parseOr(orderListSchema, await http.request('/api/orders'));
        },
        // Regroupe toutes les lignes d'un même paiement et renvoie le total RÉELLEMENT facturé
        // par Stripe (articles + livraison) — utilisé par l'écran de confirmation de commande.
        async orderGroup(paymentIntentId: string): Promise<OrderGroup> {
            return parseOr(
                orderGroupSchema,
                await http.request(`/api/orders/group/${paymentIntentId}`),
            );
        },
    };
}
