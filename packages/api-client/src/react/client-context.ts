'use client';

import { createContext, useContext } from 'react';

import type { LumirisClient } from '../index';

const ApiClientContext = createContext<LumirisClient | null>(null);
ApiClientContext.displayName = 'LumirisApiClientContext';

export const ApiClientProvider = ApiClientContext.Provider;

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
