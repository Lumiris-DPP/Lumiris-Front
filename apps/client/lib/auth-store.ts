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
    /** Demo mode: sign in with a mock artisan ID (no token) */
    signIn: (id: string) => void;
    /** Real mode: sign in with JWT token and user data from the API */
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
            signIn: (id) => set({ artisanId: id, token: null, userName: null, signedInAt: Date.now() }),
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

export const signIn = (id: string) => useAuthStore.getState().signIn(id);
export const signInWithToken = (artisanId: string | null, token: string, userName: string | null) =>
    useAuthStore.getState().signInWithToken(artisanId, token, userName);
export const signOut = () => useAuthStore.getState().signOut();
