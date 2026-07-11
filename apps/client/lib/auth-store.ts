'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@lumiris/types';
import { safeJSONStorage } from './persist-storage';

const ATELIER_AUTH_STORAGE_KEY = 'atelier-auth';

interface AuthState {
    /** Stable per-account id, always set once logged in (demo or real). Used to gate/key onboarding state. */
    userId: string | null;
    /** Backend artisan-profile id — null until KYB onboarding creates the profile. */
    artisanId: string | null;
    /** Only 'artisan' accounts go through KYB onboarding — other roles skip it entirely. */
    role: UserRole | null;
    token: string | null;
    refreshToken: string | null;
    userName: string | null;
    signedInAt: number | null;
    signInWithToken: (
        userId: string,
        artisanId: string | null,
        role: UserRole,
        token: string,
        refreshToken: string,
        userName: string | null,
    ) => void;
    /** Called by the api-client after a transparent token refresh. */
    updateTokens: (token: string, refreshToken: string) => void;
    signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            userId: null,
            artisanId: null,
            role: null,
            token: null,
            refreshToken: null,
            userName: null,
            signedInAt: null,
            signInWithToken: (userId, artisanId, role, token, refreshToken, userName) =>
                set({ userId, artisanId, role, token, refreshToken, userName, signedInAt: Date.now() }),
            updateTokens: (token, refreshToken) => set({ token, refreshToken }),
            signOut: () => {
                set({
                    userId: null,
                    artisanId: null,
                    role: null,
                    token: null,
                    refreshToken: null,
                    userName: null,
                    signedInAt: null,
                });
                void useAuthStore.persist.clearStorage();
            },
        }),
        {
            name: ATELIER_AUTH_STORAGE_KEY,
            storage: safeJSONStorage,
            version: 5,
            partialize: (s) => ({
                userId: s.userId,
                artisanId: s.artisanId,
                role: s.role,
                token: s.token,
                refreshToken: s.refreshToken,
                userName: s.userName,
                signedInAt: s.signedInAt,
            }),
        },
    ),
);

export const signInWithToken = (
    userId: string,
    artisanId: string | null,
    role: UserRole,
    token: string,
    refreshToken: string,
    userName: string | null,
) => useAuthStore.getState().signInWithToken(userId, artisanId, role, token, refreshToken, userName);
export const signOut = () => useAuthStore.getState().signOut();
