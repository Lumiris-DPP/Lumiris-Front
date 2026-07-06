'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ArtisanProfileResponse } from '@lumiris/api-client';

export type VerificationStatus = 'unregistered' | 'pending' | 'rejected' | 'verified';

export interface VerificationRecord {
    status: VerificationStatus;
    siret: string | null;
    rejectionReason: string | null;
}

const DEFAULT_RECORD: VerificationRecord = { status: 'unregistered', siret: null, rejectionReason: null };

const STATUS_MAP: Record<ArtisanProfileResponse['status'], VerificationStatus> = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
};

interface VerificationState {
    records: Record<string, VerificationRecord>;
    setFromProfile: (userId: string, profile: ArtisanProfileResponse) => void;
    /** Backend upserts on re-register, so a rejected artisan can resubmit through /onboarding again. */
    reset: (userId: string) => void;
    getRecord: (userId: string) => VerificationRecord;
}

const noopStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
};

export const useVerificationStore = create<VerificationState>()(
    persist(
        (set, get) => ({
            records: {},
            setFromProfile: (userId, profile) =>
                set((s) => ({
                    records: {
                        ...s.records,
                        [userId]: {
                            status: STATUS_MAP[profile.status],
                            siret: profile.siret ?? null,
                            rejectionReason: profile.rejectionReason ?? null,
                        },
                    },
                })),
            reset: (userId) =>
                set((s) => ({
                    records: { ...s.records, [userId]: DEFAULT_RECORD },
                })),
            getRecord: (userId) => get().records[userId] ?? DEFAULT_RECORD,
        }),
        {
            name: 'lumiris-verification',
            storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
            // Bumped: earlier builds cached bogus "pending" records from the empty-shell
            // ArtisanProfile bug (see auth-guard.tsx) — discard them, real mode now trusts
            // GET /api/artisans/me over this cache anyway.
            version: 3,
            migrate: () => ({ records: {} }),
        },
    ),
);
