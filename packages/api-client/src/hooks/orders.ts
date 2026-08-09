'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
    type UseQueryOptions,
} from '@tanstack/react-query';

import { CACHE_TIMES } from '../core/cache';
import { useApiClient } from '../core/provider';
import { notificationKeys } from './notifications';
import type {
    OrderDetail,
    OrderGroup,
    OrderResponse,
    ReasonInput,
    RefundInput,
    ReturnDecisionInput,
    SellerOrder,
    ShipOrderInput,
} from '../types/orders';

export const orderKeys = {
    all: () => ['orders'] as const,
    list: () => ['orders', 'list'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    group: (paymentIntentId: string) => ['orders', 'group', paymentIntentId] as const,
    sellerAll: () => ['seller-orders'] as const,
    sellerList: () => ['seller-orders', 'list'] as const,
    sellerDetail: (id: string) => ['seller-orders', 'detail', id] as const,
};

// ── Acheteur (VISION) ───────────────────────────────────────────────────────

export function useMyOrders(options?: Omit<UseQueryOptions<OrderResponse[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<OrderResponse[], Error>({
        queryKey: orderKeys.list(),
        queryFn: () => client.orders.list(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}

// Suivi d'une commande : l'état évolue côté vendeur (expédition, décision de retour) sans action
// de l'acheteur, et l'écran porte le fil de conversation — d'où la cadence « conversation ».
export function useOrderDetail(
    orderId?: string | null,
    options?: Omit<UseQueryOptions<OrderDetail, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<OrderDetail, Error>({
        queryKey: orderKeys.detail(orderId ?? ''),
        queryFn: () => client.orders.get(orderId as string),
        enabled: Boolean(orderId),
        staleTime: CACHE_TIMES.CONVERSATION,
        refetchInterval: CACHE_TIMES.CONVERSATION,
        ...options,
    });
}

// Groupe de commande (toutes les lignes d'un même PaymentIntent) + total réellement facturé.
// Utilisé par l'écran de confirmation, qui peut poller jusqu'à ce que le statut quitte PENDING
// (webhook Stripe). La query reste désactivée tant qu'aucun paymentIntentId n'est fourni.
export function useOrderGroup(
    paymentIntentId?: string | null,
    options?: Omit<UseQueryOptions<OrderGroup, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<OrderGroup, Error>({
        queryKey: orderKeys.group(paymentIntentId ?? ''),
        queryFn: () => client.orders.group(paymentIntentId as string),
        enabled: Boolean(paymentIntentId),
        staleTime: CACHE_TIMES.DETAIL,
        ...options,
    });
}

interface OrderActionVars<TInput = void> {
    orderId: string;
    input: TInput;
}

// Toute transition change l'état vu par les DEUX parties et produit une notification : on
// réinvalide les trois familles de clés plutôt que de deviner laquelle a bougé.
function useOrderTransition<TInput>(
    mutationFn: (vars: OrderActionVars<TInput>) => Promise<void>,
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<TInput>>, 'mutationFn'>,
) {
    const queryClient = useQueryClient();
    return useMutation<void, Error, OrderActionVars<TInput>>({
        mutationFn,
        ...options,
        onSuccess: (...args) => {
            void queryClient.invalidateQueries({ queryKey: orderKeys.all() });
            void queryClient.invalidateQueries({ queryKey: orderKeys.sellerAll() });
            void queryClient.invalidateQueries({ queryKey: notificationKeys.all() });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useConfirmDelivery(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<void>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<void>(({ orderId }) => client.orders.confirmDelivery(orderId), options);
}

export function useRequestReturn(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<ReasonInput>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<ReasonInput>(
        ({ orderId, input }) => client.orders.requestReturn(orderId, input),
        options,
    );
}

export function useOpenDispute(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<ReasonInput>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<ReasonInput>(({ orderId, input }) => client.orders.openDispute(orderId, input), options);
}

// Fil de conversation acheteur → atelier, ouvert à tout moment (pas seulement en litige).
export function usePostOrderMessage(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<ReasonInput>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<ReasonInput>(({ orderId, input }) => client.orders.postMessage(orderId, input), options);
}

// Annulation avant expédition, côté acheteur.
export function useCancelOrder(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<ReasonInput>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<ReasonInput>(({ orderId, input }) => client.orders.cancel(orderId, input), options);
}

// ── Vendeur (ATELIER) ───────────────────────────────────────────────────────

// Une seule requête sert les quatre onglets : l'écran affiche en permanence les compteurs de tous.
export function useSellerOrders(options?: Omit<UseQueryOptions<SellerOrder[], Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<SellerOrder[], Error>({
        queryKey: orderKeys.sellerList(),
        queryFn: () => client.sellerOrders.list(),
        staleTime: CACHE_TIMES.REALTIME,
        refetchInterval: CACHE_TIMES.REALTIME,
        ...options,
    });
}

export function useShipOrder(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<ShipOrderInput>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<ShipOrderInput>(
        ({ orderId, input }) => client.sellerOrders.ship(orderId, input),
        options,
    );
}

export function useDecideReturn(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<ReturnDecisionInput>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<ReturnDecisionInput>(
        ({ orderId, input }) => client.sellerOrders.decideReturn(orderId, input),
        options,
    );
}

export function useMarkReturnReceived(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<void>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<void>(({ orderId }) => client.sellerOrders.markReturnReceived(orderId), options);
}

export function useRefundOrder(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<RefundInput>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<RefundInput>(({ orderId, input }) => client.sellerOrders.refund(orderId, input), options);
}

// Même fil de conversation que côté acheteur, vu de l'atelier.
export function usePostSellerMessage(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<ReasonInput>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<ReasonInput>(
        ({ orderId, input }) => client.sellerOrders.postMessage(orderId, input),
        options,
    );
}

// Annulation avant expédition, côté atelier (rupture, pièce abîmée).
export function useCancelSellerOrder(
    options?: Omit<UseMutationOptions<void, Error, OrderActionVars<ReasonInput>>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useOrderTransition<ReasonInput>(({ orderId, input }) => client.sellerOrders.cancel(orderId, input), options);
}
