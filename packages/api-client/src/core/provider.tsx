'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import {
    QueryClient,
    QueryClientProvider,
    MutationCache,
    useQueryClient,
    type DefaultOptions,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { isApiError, type ApiError } from './errors';
import { createClient, type ClientOptions, type LumirisClient } from '../client';

const ApiClientContext = createContext<LumirisClient | null>(null);
ApiClientContext.displayName = 'LumirisApiClientContext';

const ApiClientProvider = ApiClientContext.Provider;

export function useApiClient(): LumirisClient {
    const client = useContext(ApiClientContext);
    if (!client) {
        throw new Error(
            '[lumiris/api-client] useApiClient must be used inside <QueryProvider client={...}>. ' +
                'Wrap your app/layout.tsx with QueryProvider passing the singleton from lib/api.ts.',
        );
    }
    return client;
}

export function useApiQueryClient(): QueryClient {
    return useQueryClient();
}

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

export interface ApiProviderProps extends Omit<QueryProviderProps, 'client'>, Omit<ClientOptions, 'baseUrl'> {
    baseUrl: string;
    children: ReactNode;
}

export function ApiProvider({
    baseUrl,
    getToken,
    getRefreshToken,
    onTokensRefreshed,
    onUnauthorized,
    timeoutMs,
    maxRetries,
    children,
    ...queryProviderProps
}: ApiProviderProps) {
    const [client] = useState(() =>
        createClient({
            baseUrl,
            ...(getToken !== undefined ? { getToken } : {}),
            ...(getRefreshToken !== undefined ? { getRefreshToken } : {}),
            ...(onTokensRefreshed !== undefined ? { onTokensRefreshed } : {}),
            ...(onUnauthorized !== undefined ? { onUnauthorized } : {}),
            ...(timeoutMs !== undefined ? { timeoutMs } : {}),
            ...(maxRetries !== undefined ? { maxRetries } : {}),
        }),
    );

    return (
        <QueryProvider client={client} {...queryProviderProps}>
            {children}
        </QueryProvider>
    );
}
