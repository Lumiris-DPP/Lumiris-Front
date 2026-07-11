'use client';

import { useAuthStore } from './auth-store';
import { makeHydratedHook } from './use-store-hydrated';

export function useAuthArtisanId(): string | null {
    return useAuthStore((s) => s.artisanId);
}

export function useAuthUserId(): string | null {
    return useAuthStore((s) => s.userId);
}

export function useAuthRole() {
    return useAuthStore((s) => s.role);
}

export function useAuthToken(): string | null {
    return useAuthStore((s) => s.token);
}

export function useAuthUserName(): string | null {
    return useAuthStore((s) => s.userName);
}

export const useAuthHydrated = makeHydratedHook(useAuthStore);
