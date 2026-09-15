'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AdminUser } from '@lumiris/types';
import { auth, type AdminSession } from './session';

interface CurrentUserContextValue {
    session: AdminSession | null;
    currentUser: AdminUser | null;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function AdminUserProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<AdminSession | null>(null);

    useEffect(() => {
        setSession(auth.getSession());
        return auth.subscribe(setSession);
    }, []);

    const value = useMemo<CurrentUserContextValue>(
        () => ({
            session,
            currentUser: session?.user ?? null,
        }),
        [session],
    );

    return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

function useContextOrThrow(): CurrentUserContextValue {
    const ctx = useContext(CurrentUserContext);
    if (!ctx) throw new Error('useCurrentUser/useSession must be used inside <AdminUserProvider>.');
    return ctx;
}

export function useCurrentUser(): AdminUser | null {
    return useContextOrThrow().currentUser;
}

export function useSession(): AdminSession | null {
    return useContextOrThrow().session;
}
