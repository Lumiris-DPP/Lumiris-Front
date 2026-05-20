'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { createKeys } from '../keys';
import type { LoginRequest, LoginResponse } from '../auth';

import { useApiClient } from './client-context';

export const authKeys = createKeys('auth');

export function useLogin(options?: Omit<UseMutationOptions<LoginResponse, Error, LoginRequest>, 'mutationFn'>) {
    const client = useApiClient();
    return useMutation<LoginResponse, Error, LoginRequest>({
        mutationFn: (req) => client.auth.login(req),
        ...options,
    });
}
