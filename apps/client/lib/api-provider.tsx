'use client';

import { ApiProvider } from '@lumiris/api-client/react';
import { env } from '@/env';
import { useAuthStore, signOut } from '@/lib/auth-store';

export function ClientApiProvider({ children }: { children: React.ReactNode }) {
    const userId = useAuthStore((s) => s.userId);
    const signedInAt = useAuthStore((s) => s.signedInAt);
    // Vérifie que la requête appartient encore à cette session.
    const currentSession = () => {
        const state = useAuthStore.getState();
        return state.userId === userId && state.signedInAt === signedInAt;
    };
    return (
        <ApiProvider
            key={`${userId ?? 'anon'}:${signedInAt ?? ''}`}
            baseUrl={env.NEXT_PUBLIC_API_BASE_URL}
            getToken={() => (currentSession() ? (useAuthStore.getState().token ?? undefined) : undefined)}
            getRefreshToken={() => (currentSession() ? (useAuthStore.getState().refreshToken ?? undefined) : undefined)}
            onTokensRefreshed={({ token, refreshToken }) => {
                if (currentSession()) useAuthStore.getState().updateTokens(token, refreshToken);
            }}
            onUnauthorized={() => {
                if (currentSession()) signOut();
            }}
        >
            {children}
        </ApiProvider>
    );
}
