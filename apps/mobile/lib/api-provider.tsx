'use client';

import { ApiProvider } from '@lumiris/api-client/react';
import { env } from '@/env';
import { readToken, readRefreshToken, updateTokens } from '@/lib/auth/storage';
import { clearUser } from '@/lib/auth';
import { useUser } from '@/lib/auth/use-user';
import { WardrobeSyncBridge } from '@/lib/wardrobe-sync-bridge';
import { PushRegistrationBridge } from '@/lib/push-registration-bridge';

/** Isole le cache API par compte et raccorde les synchronisations locales. */
export function ClientApiProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    return (
        <ApiProvider
            // Les clés commandes de l'API sont communes : chaque compte possède donc son cache.
            key={user?.id ?? 'anon'}
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
