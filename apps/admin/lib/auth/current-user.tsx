'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AdminUser } from '@lumiris/types';
import { mockAdminUsers } from '@lumiris/mock-data';

const DEFAULT_USER: AdminUser = mockAdminUsers[0] ?? {
    id: 'ADM-DEV',
    email: 'dev@lumiris.fr',
    fullName: 'Dev Admin',
    role: 'platform_admin',
    createdAt: new Date('2026-01-01').toISOString(),
};

interface CurrentUserContextValue {
    currentUser: AdminUser;
    setCurrentUser: (user: AdminUser) => void;
    availableUsers: readonly AdminUser[];
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function AdminUserProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AdminUser>(DEFAULT_USER);

    const value = useMemo<CurrentUserContextValue>(
        () => ({
            currentUser,
            setCurrentUser,
            availableUsers: mockAdminUsers,
        }),
        [currentUser],
    );

    return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): AdminUser {
    const ctx = useContext(CurrentUserContext);
    if (!ctx) throw new Error('useCurrentUser must be used inside <AdminUserProvider>.');
    return ctx.currentUser;
}

export function useAdminUserSwitcher(): {
    currentUser: AdminUser;
    setCurrentUser: (user: AdminUser) => void;
    availableUsers: readonly AdminUser[];
} {
    const ctx = useContext(CurrentUserContext);
    if (!ctx) throw new Error('useAdminUserSwitcher must be used inside <AdminUserProvider>.');
    return ctx;
}
