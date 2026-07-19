import { z } from 'zod';

import type { Http } from '../core/http';
import { parseOr } from '../core/validate';
import {
    marketplaceItemSchema,
    paymentIntentResponseSchema,
    searchResultSchema,
    suggestionResultSchema,
    decisionLogSchema,
    type CartIntentRequest,
    type ConvertDppRequest,
    type MarketplaceItem,
    type MarketplaceSearchParams,
    type PaymentIntentResponse,
    type ProductPayload,
    type SearchResult,
    type SuggestInput,
    type SuggestionResult,
    type DecisionLog,
} from '../types/marketplace';

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
        // Vue d'une fiche produit (fire-and-forget) — alimente les stats vendeur (vues).
        trackView(productId: string): Promise<void> {
            return http.request<void>(`/public/marketplace/products/${productId}/view`, {
                method: 'POST',
                skipJson: true,
            });
        },

        // ── Achat direct in-app (LUMIRIS-22) ────────────────────────────────
        // Panier → PaymentIntent Connect ; le front confirme via Payment Element embarqué.
        async checkoutIntent(payload: CartIntentRequest): Promise<PaymentIntentResponse> {
            return parseOr(
                paymentIntentResponseSchema,
                await http.request('/api/marketplace/checkout/intent', { method: 'POST', body: payload }),
            );
        },
    };
}
