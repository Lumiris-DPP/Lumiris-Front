'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ATELIER_ADD_ONS, ATELIER_PLANS, mockArtisanById, mockPaymentHistory } from '@lumiris/mock-data';
import type { ArtisanTier, AtelierPlanTier } from '@lumiris/types';

export type BillingCycle = 'monthly' | 'annual';
type PaymentEntryKind = 'plan' | 'atelier-plus';

interface PaymentEntry {
    id: string;
    date: string;
    amount: number;
    plan: string;
    status: 'paid';
    kind: PaymentEntryKind;
}

interface BillingState {
    tier: ArtisanTier;
    atelierPlus: boolean;
    billingCycle: BillingCycle;
    cardLast4: string;
    invoiceHistory: PaymentEntry[];
}

interface BillingStoreState {
    byArtisan: Record<string, BillingState>;
    setTier: (artisanId: string, tier: ArtisanTier, opts: { amount: number; cycle: BillingCycle }) => void;
    setAtelierPlus: (artisanId: string, on: boolean, opts?: { amount?: number }) => void;
    setBillingCycle: (artisanId: string, cycle: BillingCycle) => void;
}

const noopStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
};

const TIER_TO_PLAN: Record<ArtisanTier, AtelierPlanTier> = {
    Solo: 'solo',
    Studio: 'studio',
    Maison: 'maison',
};

export const PLAN_TO_TIER: Record<AtelierPlanTier, ArtisanTier> = {
    solo: 'Solo',
    studio: 'Studio',
    maison: 'Maison',
};

export const ATELIER_PLUS_MONTHLY_EUR = ATELIER_ADD_ONS[0]?.monthlyEur ?? 19;
const ATELIER_PLUS_YEARLY_EUR = ATELIER_ADD_ONS[0]?.yearlyEur ?? 190;
export const ATELIER_PLUS_LABEL = ATELIER_ADD_ONS[0]?.label ?? 'ATELIER+';

export function planMonthly(tier: ArtisanTier): number {
    const plan = ATELIER_PLANS.find((p) => p.tier === TIER_TO_PLAN[tier]);
    return plan?.monthlyEur ?? 0;
}

export function planYearly(tier: ArtisanTier): number {
    const plan = ATELIER_PLANS.find((p) => p.tier === TIER_TO_PLAN[tier]);
    return plan?.yearlyEur ?? 0;
}

export function planAmount(tier: ArtisanTier, cycle: BillingCycle): number {
    return cycle === 'annual' ? planYearly(tier) : planMonthly(tier);
}

export function atelierPlusAmount(cycle: BillingCycle): number {
    return cycle === 'annual' ? ATELIER_PLUS_YEARLY_EUR : ATELIER_PLUS_MONTHLY_EUR;
}

function newEntryId(): string {
    return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function defaultBilling(artisanId: string): BillingState {
    const artisan = mockArtisanById(artisanId);
    const tier = artisan?.tier ?? 'Solo';
    const atelierPlus = artisan?.plus ?? false;
    const initialHistory: PaymentEntry[] = mockPaymentHistory
        .filter((p) => p.subscriberKind === 'artisan' && p.subscriberId === artisanId && p.status === 'succeeded')
        .slice(0, 12)
        .map((p) => ({
            id: p.id,
            date: p.chargedAt,
            amount: p.amountEur,
            plan: `${tier} (mensuel)`,
            status: 'paid' as const,
            kind: 'plan' as const,
        }));
    return {
        tier,
        atelierPlus,
        billingCycle: 'monthly',
        cardLast4: '4242',
        invoiceHistory: initialHistory,
    };
}

export const useBillingStore = create<BillingStoreState>()(
    persist(
        (set) => ({
            byArtisan: {},
            setTier: (artisanId, tier, { amount, cycle }) =>
                set((s) => {
                    const cur = s.byArtisan[artisanId] ?? defaultBilling(artisanId);
                    const entry: PaymentEntry = {
                        id: newEntryId(),
                        date: new Date().toISOString(),
                        amount,
                        plan: `${tier} (${cycle === 'annual' ? 'annuel' : 'mensuel'})`,
                        status: 'paid',
                        kind: 'plan',
                    };
                    return {
                        byArtisan: {
                            ...s.byArtisan,
                            [artisanId]: {
                                ...cur,
                                tier,
                                billingCycle: cycle,
                                invoiceHistory: [entry, ...cur.invoiceHistory],
                            },
                        },
                    };
                }),
            setAtelierPlus: (artisanId, on, opts) =>
                set((s) => {
                    const cur = s.byArtisan[artisanId] ?? defaultBilling(artisanId);
                    if (on) {
                        const entry: PaymentEntry = {
                            id: newEntryId(),
                            date: new Date().toISOString(),
                            amount: opts?.amount ?? atelierPlusAmount(cur.billingCycle),
                            plan: ATELIER_PLUS_LABEL,
                            status: 'paid',
                            kind: 'atelier-plus',
                        };
                        return {
                            byArtisan: {
                                ...s.byArtisan,
                                [artisanId]: {
                                    ...cur,
                                    atelierPlus: true,
                                    invoiceHistory: [entry, ...cur.invoiceHistory],
                                },
                            },
                        };
                    }
                    const idx = cur.invoiceHistory.findIndex((e) => e.kind === 'atelier-plus');
                    const nextHistory =
                        idx === -1 ? cur.invoiceHistory : cur.invoiceHistory.filter((_, i) => i !== idx);
                    return {
                        byArtisan: {
                            ...s.byArtisan,
                            [artisanId]: {
                                ...cur,
                                atelierPlus: false,
                                invoiceHistory: nextHistory,
                            },
                        },
                    };
                }),
            setBillingCycle: (artisanId, cycle) =>
                set((s) => {
                    const cur = s.byArtisan[artisanId] ?? defaultBilling(artisanId);
                    return {
                        byArtisan: {
                            ...s.byArtisan,
                            [artisanId]: { ...cur, billingCycle: cycle },
                        },
                    };
                }),
        }),
        {
            name: 'atelier-billing',
            version: 1,
            storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
        },
    ),
);

export function useBilling(artisanId: string): BillingState {
    const stored = useBillingStore((s) => s.byArtisan[artisanId]);
    return stored ?? defaultBilling(artisanId);
}

export function useBillingHydrated(): boolean {
    const [hydrated, setHydrated] = useState(useBillingStore.persist.hasHydrated());
    useEffect(() => {
        const unsub = useBillingStore.persist.onFinishHydration(() => setHydrated(true));
        if (useBillingStore.persist.hasHydrated()) setHydrated(true);
        return unsub;
    }, []);
    return hydrated;
}
