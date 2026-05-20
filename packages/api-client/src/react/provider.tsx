'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, MutationCache, type DefaultOptions } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { isApiError, type ApiError } from '../errors';
import type { LumirisClient } from '../index';

import { ApiClientProvider } from './client-context';

export interface QueryProviderProps {
    children: ReactNode;
    client: LumirisClient;
    onMutationError?: (error: ApiError | Error) => void;
    defaultOptions?: DefaultOptions;
    devtools?: boolean;
}

const NO_RETRY_CODES: readonly string[] = ['NETWORK_ERROR', 'AUTH_ERROR', 'VALIDATION_ERROR', 'NOT_FOUND', 'FORBIDDEN'];

const DEFAULT_QUERY_OPTIONS: DefaultOptions = {
    queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
            if (isApiError(error) && NO_RETRY_CODES.includes(error.code)) return false;
            return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    mutations: {
        retry: 0,
    },
};

type CreateClientOptions = Pick<QueryProviderProps, 'onMutationError' | 'defaultOptions'>;

function createQueryClient(opts: CreateClientOptions): QueryClient {
    const mutationCache = new MutationCache({
        onError: (error, _vars, _ctx, mutation) => {
            if (mutation.meta?.['suppressGlobalError'] === true) return;
            if (isApiError(error)) {
                if (error.code === 'AUTH_ERROR' || error.code === 'VALIDATION_ERROR') return;
            }
            opts.onMutationError?.(error as ApiError | Error);
        },
    });
    return new QueryClient({
        mutationCache,
        defaultOptions: { ...DEFAULT_QUERY_OPTIONS, ...opts.defaultOptions },
    });
}

export function QueryProvider({ children, client, devtools = true, ...rest }: QueryProviderProps) {
    const [queryClient] = useState(() => createQueryClient(rest));
    const showDevtools = devtools && process.env.NODE_ENV !== 'production';

    return (
        <QueryClientProvider client={queryClient}>
            <ApiClientProvider value={client}>
                {children}
                {showDevtools ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" /> : null}
            </ApiClientProvider>
        </QueryClientProvider>
    );
}
