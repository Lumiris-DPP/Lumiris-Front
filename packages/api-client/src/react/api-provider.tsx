'use client';

import { useState, type ReactNode } from 'react';

import { createClient, type ClientOptions } from '../index';

import { QueryProvider, type QueryProviderProps } from './provider';

export interface ApiProviderProps extends Omit<QueryProviderProps, 'client'>, Omit<ClientOptions, 'baseUrl'> {
    baseUrl: string;
    children: ReactNode;
}

export function ApiProvider({
    baseUrl,
    getToken,
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
