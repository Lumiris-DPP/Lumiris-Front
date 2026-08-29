'use client';

import { ApiProvider } from '@lumiris/api-client/react';
import { env } from '@/env';
import { readToken, readRefreshToken, updateTokens } from '@/lib/auth/storage';
import { clearUser } from '@/lib/auth';
import { WardrobeSyncBridge } from '@/lib/wardrobe-sync-bridge';
import { PushRegistrationBridge } from '@/lib/push-registration-bridge';

export function ClientApiProvider({ children }: { children: React.ReactNode }) {
    return (
        <ApiProvider
            baseUrl={env.NEXT_PUBLIC_API_BASE_URL}
            getToken={readToken}
            getRefreshToken={readRefreshToken}
            onTokensRefreshed={({ token, refreshToken }) => updateTokens(token, refreshToken)}
            onUnauthorized={clearUser}
        >
            <WardrobeSyncBridge />
            <PushRegistrationBridge />
            {children}
        </ApiProvider>
    );
}
