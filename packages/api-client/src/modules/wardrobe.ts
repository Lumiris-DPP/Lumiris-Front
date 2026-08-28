import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import { wardrobeItemDtoSchema, type WardrobeItemDto, type WardrobeSyncRequest } from '../types/wardrobe';

const wardrobeListSchema = z.array(wardrobeItemDtoSchema);

// LUMIRIS-22 · Garde-Robe de l'acheteur (pièces achetées en direct in-app). Le suivi des
// commandes elles-mêmes vit dans `modules/orders`.
export function wardrobeApi(http: Http) {
    return {
        async list(): Promise<WardrobeItemDto[]> {
            return parseOr(wardrobeListSchema, await http.request('/api/wardrobe'));
        },
        async sync(request: WardrobeSyncRequest): Promise<WardrobeItemDto[]> {
            return parseOr(
                wardrobeListSchema,
                await http.request('/api/wardrobe/sync', { method: 'POST', body: request }),
            );
        },
    };
}
