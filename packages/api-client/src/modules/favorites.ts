import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import { marketplaceItemSchema, type MarketplaceItem } from '../types/marketplace';

const favoriteListSchema = z.array(marketplaceItemSchema);

// Liste d'envies de l'acheteur. PUT et non POST : l'identifiant est connu du client et l'opération
// est idempotente — un double tap ne peut pas créer deux favoris.
export function favoritesApi(http: Http) {
    return {
        async list(): Promise<MarketplaceItem[]> {
            return parseOr(favoriteListSchema, await http.request('/api/marketplace/favorites'));
        },
        add(productId: string): Promise<void> {
            return http.request<void>(`/api/marketplace/favorites/${productId}`, {
                method: 'PUT',
                skipJson: true,
            });
        },
        remove(productId: string): Promise<void> {
            return http.request<void>(`/api/marketplace/favorites/${productId}`, {
                method: 'DELETE',
                skipJson: true,
            });
        },
    };
}
