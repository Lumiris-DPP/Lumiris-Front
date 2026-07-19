import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import { orderDtoSchema, wardrobeItemDtoSchema, type OrderDto, type WardrobeItemDto } from '../types/wardrobe';

const wardrobeListSchema = z.array(wardrobeItemDtoSchema);
const orderListSchema = z.array(orderDtoSchema);

// LUMIRIS-22 · Garde-Robe de l'acheteur (pièces achetées en direct in-app) + ses commandes.
export function wardrobeApi(http: Http) {
    return {
        async list(): Promise<WardrobeItemDto[]> {
            return parseOr(wardrobeListSchema, await http.request('/api/wardrobe'));
        },
        async orders(): Promise<OrderDto[]> {
            return parseOr(orderListSchema, await http.request('/api/orders'));
        },
    };
}
