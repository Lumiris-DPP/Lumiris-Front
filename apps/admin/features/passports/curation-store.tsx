'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { IrisGrade } from '@lumiris/types';

// Overlay en mémoire qui n'altère jamais les fixtures @lumiris/mock-data — encode les statuts hors pivot v6.1 jusqu'à l'arrivée du backend.

export type CurationOverlayStatus = 'pending' | 'validated' | 'changes_requested' | 'flagged' | 'archived';

interface CurationOverlay {
    status: CurationOverlayStatus;
    flagReason?: string;
    flagTags?: readonly string[];
    changesMessage?: string;
    changesChecklist?: readonly string[];
    /** Overlay visuel uniquement — pas un vrai changement de score. */
    overrideGrade?: IrisGrade;
    overrideReason?: string;
    publishedAt?: string;
}

interface CurationStoreValue {
    overlays: ReadonlyMap<string, CurationOverlay>;
    setOverlay: (passportId: string, patch: Partial<CurationOverlay>) => void;
}

const CurationStoreContext = createContext<CurationStoreValue | null>(null);

export function CurationStoreProvider({ children }: { children: ReactNode }) {
    const [overlays, setOverlays] = useState<Map<string, CurationOverlay>>(() => new Map());

    const setOverlay = useCallback((passportId: string, patch: Partial<CurationOverlay>) => {
        setOverlays((prev) => {
            const next = new Map(prev);
            const current = next.get(passportId) ?? { status: 'pending' as CurationOverlayStatus };
            next.set(passportId, { ...current, ...patch });
            return next;
        });
    }, []);

    const value = useMemo<CurationStoreValue>(() => ({ overlays, setOverlay }), [overlays, setOverlay]);

    return <CurationStoreContext.Provider value={value}>{children}</CurationStoreContext.Provider>;
}

export function useCurationStore(): CurationStoreValue {
    const ctx = useContext(CurationStoreContext);
    if (!ctx) {
        throw new Error('useCurationStore must be used inside <CurationStoreProvider>.');
    }
    return ctx;
}
