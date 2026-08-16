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
                        q: params?.q || undefined,
                        category: params?.category,
                        material: params?.material,
                        origin: params?.origin,
                        sort: params?.sort,
                        personalize: params?.personalize?.length ? params.personalize.join(',') : undefined,
                    },
                }),
            );
        },

        // Fiches d'un panier en un appel. Les produits devenus indisponibles sont simplement
        // absents de la réponse — l'appelant compare aux identifiants demandés pour le dire.
        async getPublicProducts(ids: readonly string[]): Promise<MarketplaceItem[]> {
            if (ids.length === 0) return [];
            return parseOr(
                marketplaceItemListSchema,
                await http.request('/public/marketplace/products', { query: { ids: ids.join(',') } }),
            );
        },

        // Fiche produit publique unique. 404 si non publié ou vendeur non payable.
        async getPublicProduct(id: string): Promise<MarketplaceItem> {
            return parseOr(marketplaceItemSchema, await http.request(`/public/marketplace/products/${id}`));
        },

        // Produit publié rattaché à un passeport scanné (par formId du DPP). 404 si aucun.
        async getProductByDpp(dppFormId: string): Promise<MarketplaceItem> {
            return parseOr(
                marketplaceItemSchema,
                await http.request(`/public/marketplace/products/by-dpp/${dppFormId}`),
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
