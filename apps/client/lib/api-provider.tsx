'use client';

import { ApiProvider } from '@lumiris/api-client/react';
import { env } from '@/env';
import { useAuthStore, signOut } from '@/lib/auth-store';

export function ClientApiProvider({ children }: { children: React.ReactNode }) {
    return (
        <ApiProvider
            baseUrl={env.NEXT_PUBLIC_API_BASE_URL}
            getToken={() => useAuthStore.getState().token ?? undefined}
            getRefreshToken={() => useAuthStore.getState().refreshToken ?? undefined}
            onTokensRefreshed={({ token, refreshToken }) => useAuthStore.getState().updateTokens(token, refreshToken)}
            onUnauthorized={signOut}
        >
            {children}
        </ApiProvider>
    );
}
