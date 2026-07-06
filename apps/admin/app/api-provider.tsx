'use client';

import type { ReactNode } from 'react';
import { ApiProvider } from '@lumiris/api-client/react';
import { env } from '@/env';
import { auth, getSessionToken, getSessionRefreshToken, updateSessionTokens } from '@/lib/auth';

export function ClientApiProvider({ children }: { children: ReactNode }) {
    return (
        <ApiProvider
            baseUrl={env.NEXT_PUBLIC_API_BASE_URL}
            getToken={getSessionToken}
            getRefreshToken={getSessionRefreshToken}
            onTokensRefreshed={({ token, refreshToken }) => updateSessionTokens(token, refreshToken)}
            onUnauthorized={() => void auth.signOut()}
        >
            {children}
        </ApiProvider>
    );
}
