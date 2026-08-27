'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { createKeys } from '../core/keys';
import type { DashboardInfoDto } from '../types/dashboard';

import { useApiClient } from '../core/provider';

export const dashboardKeys = createKeys('dashboard');

export function useDashboardInfo(options?: Omit<UseQueryOptions<DashboardInfoDto, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<DashboardInfoDto, Error>({
        queryKey: dashboardKeys.custom('info'),
        queryFn: () => client.dashboard.getInfo(),
        staleTime: 60 * 1000,
        retry: false,
        ...options,
    });
}
