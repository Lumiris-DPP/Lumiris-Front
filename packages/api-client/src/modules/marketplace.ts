import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import {
    marketplaceItemSchema,
    searchResultSchema,
    suggestionResultSchema,
    decisionLogSchema,
    type ConvertDppRequest,
    type MarketplaceItem,
    type MarketplaceSearchParams,
    type ProductPayload,
    type SearchResult,
    type SuggestInput,
    type SuggestionResult,
    type DecisionLog,
} from '../types/marketplace';
import { checkoutDtoSchema, type CheckoutDto } from '../types/subscription';

const marketplaceItemListSchema = z.array(marketplaceItemSchema);

export function marketplaceApi(http: Http) {
    return {
        // ── Catalogue public ────────────────────────────────────────────────
        async search(params?: MarketplaceSearchParams): Promise<SearchResult> {
            return parseOr(
                searchResultSchema,
                await http.request('/public/marketplace/search', {
                    query: {
                        category: params?.category,
                        material: params?.material,
                        origin: params?.origin,
                        sort: params?.sort,
                        personalize: params?.personalize?.length ? params.personalize.join(',') : undefined,
                    },
                }),
            );
        },

        // Suggestions sur DPP scanné : 3 alternatives de score >= au scan.
        async suggest(input: SuggestInput): Promise<SuggestionResult> {
            return parseOr(
                suggestionResultSchema,
                await http.request('/public/marketplace/suggest', { method: 'POST', body: input }),
            );
        },

        async decisionLog(id: string): Promise<DecisionLog> {
            return parseOr(decisionLogSchema, await http.request(`/api/marketplace/decision-logs/${id}`));
        },

        // ── CRUD produit côté artisan (authentifié) ─────────────────────────
        async listProducts(): Promise<MarketplaceItem[]> {
            return parseOr(marketplaceItemListSchema, await http.request('/api/marketplace/products'));
        },
        async getProduct(id: string): Promise<MarketplaceItem> {
            return parseOr(marketplaceItemSchema, await http.request(`/api/marketplace/products/${id}`));
        },
        async updateProduct(id: string, payload: ProductPayload): Promise<MarketplaceItem> {
            return parseOr(
                marketplaceItemSchema,
                await http.request(`/api/marketplace/products/${id}`, { method: 'PUT', body: payload }),
            );
        },
        deleteProduct(id: string): Promise<void> {
            return http.request<void>(`/api/marketplace/products/${id}`, { method: 'DELETE', skipJson: true });
        },
        async convertFromDpp(dppFormId: string, payload: ConvertDppRequest): Promise<MarketplaceItem> {
            return parseOr(
                marketplaceItemSchema,
                await http.request(`/api/marketplace/products/from-dpp/${dppFormId}`, {
                    method: 'POST',
                    body: payload,
                }),
            );
        },
        async buy(productId: string): Promise<CheckoutDto> {
            return parseOr(
                checkoutDtoSchema,
                await http.request(`/public/marketplace/products/${productId}/checkout`, { method: 'POST' }),
            );
        },
    };
}
