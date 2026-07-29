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
import type {
    CatalogDto,
    CheckoutDto,
    CreateSetupIntentRequest,
    PortalDto,
    SetupIntentDto,
    SubscriptionStateDto,
} from '../types/subscription';

import { useApiClient } from '../core/provider';

export const subscriptionKeys = {
    ...createKeys('subscription'),
    state: () => ['subscription', 'state'] as const,
    plans: () => ['subscription', 'plans'] as const,
};

export function useSubscriptionState(
    options?: Omit<UseQueryOptions<SubscriptionStateDto, Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<SubscriptionStateDto, Error>({
        queryKey: subscriptionKeys.state(),
        queryFn: () => client.subscription.getState(),
        staleTime: CACHE_TIMES.REALTIME,
        refetchInterval: CACHE_TIMES.REALTIME,
        refetchOnWindowFocus: true,
        ...options,
    });
}

export function usePlans(options?: Omit<UseQueryOptions<CatalogDto, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<CatalogDto, Error>({
        queryKey: subscriptionKeys.plans(),
        queryFn: () => client.subscription.getPlans(),
        staleTime: CACHE_TIMES.STATIC,
        ...options,
    });
}

export function useCreateSetupIntent(
    options?: Omit<UseMutationOptions<SetupIntentDto, Error, CreateSetupIntentRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useMutation<SetupIntentDto, Error, CreateSetupIntentRequest>({
        mutationFn: (req) => client.subscription.createSetupIntent(req),
        ...options,
    });
}

export function useConfirmSubscription(
    options?: Omit<UseMutationOptions<SubscriptionStateDto, Error, string>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<SubscriptionStateDto, Error, string>({
        mutationFn: (setupIntentId) => client.subscription.confirm(setupIntentId),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(subscriptionKeys.state(), args[0]);
            void queryClient.invalidateQueries({ queryKey: subscriptionKeys.state() });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useChangePlan(
    options?: Omit<UseMutationOptions<SubscriptionStateDto, Error, CreateSetupIntentRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<SubscriptionStateDto, Error, CreateSetupIntentRequest>({
        mutationFn: (req) => client.subscription.changePlan(req),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(subscriptionKeys.state(), args[0]);
            void queryClient.invalidateQueries({ queryKey: subscriptionKeys.state() });
            return options?.onSuccess?.(...args);
        },
    });
}

// ATELIER+ add-on : ajoute le 2ᵉ article Stripe à l'abonnement de base actif.
export function useAddAtelierPlus(options?: Omit<UseMutationOptions<SubscriptionStateDto, Error, void>, 'mutationFn'>) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<SubscriptionStateDto, Error, void>({
        mutationFn: () => client.subscription.addAtelierPlus(),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(subscriptionKeys.state(), args[0]);
            void queryClient.invalidateQueries({ queryKey: subscriptionKeys.state() });
            return options?.onSuccess?.(...args);
        },
    });
}

// Retire l'option ATELIER+ de l'abonnement de base actif.
export function useRemoveAtelierPlus(
    options?: Omit<UseMutationOptions<SubscriptionStateDto, Error, void>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<SubscriptionStateDto, Error, void>({
        mutationFn: () => client.subscription.removeAtelierPlus(),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(subscriptionKeys.state(), args[0]);
            void queryClient.invalidateQueries({ queryKey: subscriptionKeys.state() });
            return options?.onSuccess?.(...args);
        },
    });
}

export function useBillingPortal(options?: Omit<UseMutationOptions<PortalDto, Error, void>, 'mutationFn'>) {
    const client = useApiClient();
    return useMutation<PortalDto, Error, void>({
        mutationFn: () => client.subscription.openPortal(),
        ...options,
    });
}

// Résiliation in-app (cancel_at_period_end) — l'accès reste jusqu'à la fin de la période payée.
export function useCancelSubscription(
    options?: Omit<UseMutationOptions<SubscriptionStateDto, Error, void>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<SubscriptionStateDto, Error, void>({
        mutationFn: () => client.subscription.cancel(),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(subscriptionKeys.state(), args[0]);
            void queryClient.invalidateQueries({ queryKey: subscriptionKeys.state() });
            return options?.onSuccess?.(...args);
        },
    });
}

// Reprise in-app : annule une résiliation programmée avant l'échéance.
export function useResumeSubscription(
    options?: Omit<UseMutationOptions<SubscriptionStateDto, Error, void>, 'mutationFn'>,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<SubscriptionStateDto, Error, void>({
        mutationFn: () => client.subscription.resume(),
        ...options,
        onSuccess: (...args) => {
            queryClient.setQueryData(subscriptionKeys.state(), args[0]);
            void queryClient.invalidateQueries({ queryKey: subscriptionKeys.state() });
            return options?.onSuccess?.(...args);
        },
    });
}

// Hosted Stripe Checkout Session for a new subscriber; the caller redirects to the returned url.
export function useCheckoutSession(
    options?: Omit<UseMutationOptions<CheckoutDto, Error, CreateSetupIntentRequest>, 'mutationFn'>,
) {
    const client = useApiClient();
    return useMutation<CheckoutDto, Error, CreateSetupIntentRequest>({
        mutationFn: (req) => client.subscription.checkout(req),
        ...options,
    });
}
