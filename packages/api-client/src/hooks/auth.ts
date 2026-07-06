'use client';

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import type { User } from '@lumiris/types';

import { createKeys } from '../core/keys';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

import { useApiClient } from '../core/provider';

export const authKeys = createKeys('auth');

export function useLogin(options?: Omit<UseMutationOptions<AuthResponse, Error, LoginRequest>, 'mutationFn'>) {
    const client = useApiClient();
    return useMutation<AuthResponse, Error, LoginRequest>({
        mutationFn: (req) => client.auth.login(req),
        ...options,
    });
}

export function useRegister(options?: Omit<UseMutationOptions<AuthResponse, Error, RegisterRequest>, 'mutationFn'>) {
    const client = useApiClient();
    return useMutation<AuthResponse, Error, RegisterRequest>({
        mutationFn: (req) => client.auth.register(req),
        ...options,
    });
}

export function useMe(options?: Omit<UseQueryOptions<User, Error>, 'queryKey' | 'queryFn'>) {
    const client = useApiClient();
    return useQuery<User, Error>({
        queryKey: authKeys.custom('me'),
        queryFn: () => client.auth.me(),
        staleTime: 5 * 60 * 1000,
        ...options,
    });
}
