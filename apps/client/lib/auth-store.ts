'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJSONStorage } from './persist-storage';

const ATELIER_AUTH_STORAGE_KEY = 'atelier-auth';

interface AuthState {
    artisanId: string | null;
    token: string | null;
    userName: string | null;
    signedInAt: number | null;
    /** Sign in with the JWT token and user data returned by `POST /api/auth/login`. */
    signInWithToken: (artisanId: string | null, token: string, userName: string | null) => void;
    signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            artisanId: null,
            token: null,
            userName: null,
            signedInAt: null,
            signInWithToken: (artisanId, token, userName) =>
                set({ artisanId, token, userName, signedInAt: Date.now() }),
            signOut: () => {
                set({ artisanId: null, token: null, userName: null, signedInAt: null });
                void useAuthStore.persist.clearStorage();
            },
        }),
        {
            name: ATELIER_AUTH_STORAGE_KEY,
            storage: safeJSONStorage,
            version: 2,
            partialize: (s) => ({
                artisanId: s.artisanId,
                token: s.token,
                userName: s.userName,
                signedInAt: s.signedInAt,
            }),
        },
    ),
);

export const signInWithToken = (artisanId: string | null, token: string, userName: string | null) =>
    useAuthStore.getState().signInWithToken(artisanId, token, userName);
export const signOut = () => useAuthStore.getState().signOut();
