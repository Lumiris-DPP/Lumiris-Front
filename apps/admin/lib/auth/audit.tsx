'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AdminAuditLogEntry, AdminUserRole } from '@lumiris/types';
import { mockAdminAuditLog } from '@lumiris/mock-data';
import { useCurrentUser } from './current-user';

// Store en mémoire — à remplacer par un wrapper POST /admin/audit quand le backend arrivera.

type LogActionInput = Omit<AdminAuditLogEntry, 'id' | 'ts' | 'actorId' | 'actorRole' | 'ipMock'> & {
    // Override pour les évènements pré/post-session (auth.signin, auth.signin_failed, auth.signout)
    // où le user du context n'est pas encore (ou plus) la bonne source.
    actor?: { id: string; role: AdminUserRole };
};

export type AnomalyReviewStatus = 'unreviewed' | 'acknowledged' | 'escalated';

export interface AnomalyReview {
    status: AnomalyReviewStatus;
    /** Obligatoire pour `escalated`. */
    reason?: string;
    reviewedBy: string;
    reviewedAt: string;
}

interface AuditContextValue {
    entries: readonly AdminAuditLogEntry[];
    push: (entry: AdminAuditLogEntry) => void;
    anomalyReviews: ReadonlyMap<string, AnomalyReview>;
    setAnomalyReview: (anomalyId: string, review: AnomalyReview) => void;
}

const AuditContext = createContext<AuditContextValue | null>(null);

export function AuditLogProvider({ children }: { children: ReactNode }) {
    const [entries, setEntries] = useState<AdminAuditLogEntry[]>(() => [...mockAdminAuditLog]);
    const [anomalyReviews, setReviewsState] = useState<Map<string, AnomalyReview>>(() => new Map());

    const push = useCallback((entry: AdminAuditLogEntry) => {
        setEntries((prev) => [entry, ...prev]);
    }, []);

    const setAnomalyReview = useCallback((anomalyId: string, review: AnomalyReview) => {
        setReviewsState((prev) => {
            const next = new Map(prev);
            next.set(anomalyId, review);
            return next;
        });
    }, []);

    const value = useMemo<AuditContextValue>(
        () => ({ entries, push, anomalyReviews, setAnomalyReview }),
        [entries, push, anomalyReviews, setAnomalyReview],
    );

    return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAdminAuditLog(): readonly AdminAuditLogEntry[] {
    const ctx = useContext(AuditContext);
    if (!ctx) throw new Error('useAdminAuditLog must be used inside <AuditLogProvider>.');
    return ctx.entries;
}

export function useAnomalyReviews(): {
    reviews: ReadonlyMap<string, AnomalyReview>;
    setReview: (anomalyId: string, review: AnomalyReview) => void;
} {
    const ctx = useContext(AuditContext);
    if (!ctx) throw new Error('useAnomalyReviews must be used inside <AuditLogProvider>.');
    return { reviews: ctx.anomalyReviews, setReview: ctx.setAnomalyReview };
}

let nextId = 0;
function generateId(): string {
    nextId += 1;
    return `LOG-RT-${Date.now().toString(36)}-${nextId}`;
}

export function useLogAction(): (input: LogActionInput) => AdminAuditLogEntry {
    const ctx = useContext(AuditContext);
    if (!ctx) throw new Error('useLogAction must be used inside <AuditLogProvider>.');
    const user = useCurrentUser();

    return useCallback(
        (input: LogActionInput) => {
            const { actor, ...rest } = input;
            const entry: AdminAuditLogEntry = {
                id: generateId(),
                ts: new Date().toISOString(),
                actorId: actor?.id ?? user?.id ?? 'anonymous',
                actorRole: actor?.role ?? user?.role ?? 'curator',
                ipMock: '127.0.0.1',
                ...rest,
            };
            ctx.push(entry);
            return entry;
        },
        [ctx, user?.id, user?.role],
    );
}
