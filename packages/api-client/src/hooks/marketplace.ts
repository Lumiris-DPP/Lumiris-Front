'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
    type UseQueryOptions,
} from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import type {
    CartIntentRequest,
    ConvertDppRequest,
    DecisionLog,
    MarketplaceItem,
    MarketplaceSearchParams,
    PaymentIntentResponse,
    ProductPayload,
    SearchResult,
    SuggestInput,
    SuggestionResult,
} from '../types/marketplace';

export const marketplaceKeys = {
    ...createKeys('marketplace'),
    search: (params?: MarketplaceSearchParams) => ['marketplace', 'search', params] as const,
    suggest: (input?: SuggestInput | null) => ['marketplace', 'suggest', input] as const,
    products: () => ['marketplace', 'products'] as const,
    publicProduct: (id: string) => ['marketplace', 'public-product', id] as const,
    productByDpp: (dppFormId: string) => ['marketplace', 'product-by-dpp', dppFormId] as const,
    decisionLog: (id: string) => ['marketplace', 'decision-log', id] as const,
};

// Fiche produit publique unique (catalogue). La query reste désactivée tant qu'aucun id n'est
// fourni ; un 404 (NOT_FOUND, non rejoué) signifie « pièce introuvable / plus publiée ».
export function useMarketplaceProduct(
    id?: string | null,
    options?: Omit<UseQueryOptions<MarketplaceItem, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<MarketplaceItem, Error>({
        queryKey: marketplaceKeys.publicProduct(id ?? ''),
        queryFn: () => client.marketplace.getPublicProduct(id as string),
        enabled: Boolean(id),
        staleTime: CACHE_TIMES.DETAIL,
        ...options,
    });
}

// Produit Boutique publié rattaché à un passeport scanné (formId du DPP). Un 404 est
// attendu et normal (aucune annonce) : le caller masque simplement le CTA d'achat.
export function useMarketplaceProductByDpp(
    dppFormId?: string | null,
    options?: Omit<UseQueryOptions<MarketplaceItem, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<MarketplaceItem, Error>({
        queryKey: marketplaceKeys.productByDpp(dppFormId ?? ''),
        queryFn: () => client.marketplace.getProductByDpp(dppFormId as string),
        enabled: Boolean(dppFormId),
        staleTime: CACHE_TIMES.DETAIL,
        ...options,
    });
}

// Catalogue public filtré (catégorie/matière/origine) + reco perso (personalize).
export function useMarketplaceSearch(
    params?: MarketplaceSearchParams,
    options?: Omit<UseQueryOptions<SearchResult, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<SearchResult, Error>({
        queryKey: marketplaceKeys.search(params),
        queryFn: () => client.marketplace.search(params),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}

// Suggestions sur DPP scanné. Ne s'active que si un input (score) est fourni.
export function useMarketplaceSuggest(
    input?: SuggestInput | null,
    options?: Omit<UseQueryOptions<SuggestionResult, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<SuggestionResult, Error>({
        queryKey: marketplaceKeys.suggest(input),
        queryFn: () => client.marketplace.suggest(input as SuggestInput),
        enabled: input != null,
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}

// Log de décision d'un tri/suggestion (rend le classement auditable). `id` optionnel :
// la query reste désactivée tant qu'aucun identifiant n'est fourni.
export function useDecisionLog(
    id?: string | null,
    options?: Omit<UseQueryOptions<DecisionLog, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<DecisionLog, Error>({
        queryKey: marketplaceKeys.decisionLog(id ?? ''),
        queryFn: () => client.marketplace.decisionLog(id as string),
        enabled: Boolean(id),
        staleTime: CACHE_TIMES.DETAIL,
        ...options,
    });
}

// ── CRUD produit côté artisan ───────────────────────────────────────────────

export function useMyProducts(options?: Omit<UseQueryOptions<MarketplaceItem[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<MarketplaceItem[], Error>({
        queryKey: marketplaceKeys.products(),
        queryFn: () => client.marketplace.listProducts(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}

export function useProduct(
    id: string,
    options?: Omit<UseQueryOptions<MarketplaceItem, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<MarketplaceItem, Error>({
        queryKey: marketplaceKeys.detail(id),
        queryFn: () => client.marketplace.getProduct(id),
        staleTime: CACHE_TIMES.DETAIL,
        ...options,
    });
}

export interface UpdateProductVars {
    id: string;
    payload: ProductPayload;
}

export function useUpdateProduct(
    options?: Omit<UseMutationOptions<MarketplaceItem, Error, UpdateProductVars>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<MarketplaceItem, Error, UpdateProductVars>({
        mutationFn: ({ id, payload }) => client.marketplace.updateProduct(id, payload),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: marketplaceKeys.products() });
            void queryClient.invalidateQueries({ queryKey: marketplaceKeys.detail(args[1].id) });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useDeleteProduct(options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: (id) => client.marketplace.deleteProduct(id),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: marketplaceKeys.products() });
            return options?.onSuccess?.(...args);
        },
    });
}

export interface ConvertDppVars {
    dppFormId: string;
    payload: ConvertDppRequest;
}

// Convertit un DPP en annonce marketplace (côté artisan).
export function useConvertDppToProduct(
    options?: Omit<UseMutationOptions<MarketplaceItem, Error, ConvertDppVars>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<MarketplaceItem, Error, ConvertDppVars>({
        mutationFn: ({ dppFormId, payload }) => client.marketplace.convertFromDpp(dppFormId, payload),
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: marketplaceKeys.products() });
            return options?.onSuccess?.(...args);
        },
    });
}

// Panier → PaymentIntent Connect. Le caller confirme ensuite via Stripe Payment Element embarqué
// (pas de redirection). Le fulfillment (Garde-Robe + facture) est déclenché par le webhook.
export function useCheckoutIntent(
    options?: Omit<UseMutationOptions<PaymentIntentResponse, Error, CartIntentRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useMutation<PaymentIntentResponse, Error, CartIntentRequest>({
        mutationFn: (payload) => client.marketplace.checkoutIntent(payload),
        ...options,
    });
}
