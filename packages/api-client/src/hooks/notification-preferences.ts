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
import type { NotificationCategory, NotificationPreference } from '../types/notification-preferences';

export const notificationPreferenceKeys = {
    all: () => ['notification-preferences'] as const,
    list: () => ['notification-preferences', 'list'] as const,
};

export function useNotificationPreferences(
    options?: Omit<UseQueryOptions<NotificationPreference[], Error>, 'queryKey' | 'queryFn'>,
) {
    const client = useApiClient();
    return useQuery<NotificationPreference[], Error>({
        queryKey: notificationPreferenceKeys.list(),
        queryFn: () => client.notificationPreferences.list(),
        staleTime: CACHE_TIMES.LIST,
        ...options,
    });
}

export interface UpdateNotificationPreferenceVars {
    category: NotificationCategory;
    emailEnabled: boolean;
    pushEnabled: boolean;
}

interface UpdateNotificationPreferenceContext {
    snapshot?: NotificationPreference[];
}

// Bascule optimiste, comme useToggleFavorite : un switch qui attend l'aller-retour réseau avant de
// bouger se lit comme cassé.
export function useUpdateNotificationPreference(
    options?: Omit<
        UseMutationOptions<
            NotificationPreference,
            Error,
            UpdateNotificationPreferenceVars,
            UpdateNotificationPreferenceContext
        >,
        'mutationFn'
    >,
) {
    const client = useApiClient();
    const queryClient = useQueryClient();
    return useMutation<
        NotificationPreference,
        Error,
        UpdateNotificationPreferenceVars,
        UpdateNotificationPreferenceContext
    >({
        mutationFn: ({ category, emailEnabled, pushEnabled }) =>
            client.notificationPreferences.update(category, { emailEnabled, pushEnabled }),
        ...options,
        onMutate: async (vars) => {
            await queryClient.cancelQueries({ queryKey: notificationPreferenceKeys.list() });
            const snapshot = queryClient.getQueryData<NotificationPreference[]>(notificationPreferenceKeys.list());
            queryClient.setQueryData<NotificationPreference[]>(notificationPreferenceKeys.list(), (previous = []) =>
                previous.map((pref) =>
                    pref.category === vars.category
                        ? { ...pref, emailEnabled: vars.emailEnabled, pushEnabled: vars.pushEnabled }
                        : pref,
                ),
            );
            return { snapshot };
        },
        onError: (...args) => {
            const snapshot = args[2]?.snapshot;
            if (snapshot) {
                queryClient.setQueryData(notificationPreferenceKeys.list(), snapshot);
            }
            return options?.onError?.(...args);
        },
        onSettled: (...args) => {
            void queryClient.invalidateQueries({ queryKey: notificationPreferenceKeys.list() });
            return options?.onSettled?.(...args);
        },
    });
}
