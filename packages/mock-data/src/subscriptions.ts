import type { AtelierPlanTier, LocalPlanTier, PaymentEvent, Subscription, SubscriptionTier } from '@lumiris/types';
import { mockArtisans } from './artisans';
import { mockRepairers } from './retoucheurs';

const ATELIER_PRICES: Record<AtelierPlanTier, number> = { solo: 29, studio: 79, maison: 149 };
const LOCAL_PRICES: Record<LocalPlanTier, number> = { free: 0, local: 19 };
const PLUS_ADDON_EUR = 19;

const REF = new Date('2026-04-30T08:00:00Z').getTime();
const DAY = 86_400_000;
const iso = (msOffset: number) => new Date(REF + msOffset).toISOString();

function tierFromArtisan(tier: 'Solo' | 'Studio' | 'Maison'): AtelierPlanTier {
    return tier.toLowerCase() as AtelierPlanTier;
}

function buildArtisanSubscription(artisanId: string, overrides: Partial<Subscription> = {}): Subscription {
    const artisan = mockArtisans.find((a) => a.id === artisanId);
    if (!artisan) throw new Error(`Unknown artisan ${artisanId}`);
    const planTier = tierFromArtisan(artisan.tier);
    const baseMrr = ATELIER_PRICES[planTier];
    const mrr = baseMrr + (artisan.plus ? PLUS_ADDON_EUR : 0);
    return {
        id: `sub-art-${artisanId}`,
        subscriberKind: 'artisan',
        subscriberId: artisanId,
        displayName: artisan.atelierName,
        artisanTier: artisan.tier,
        tier: planTier,
        plus: artisan.plus,
        status: 'active',
        mrrEur: mrr,
        startedAt: artisan.joinedAt,
        nextBillingAt: iso(15 * DAY),
        lastChargeAt: iso(-15 * DAY),
        paymentMethod: { brand: 'visa', last4: '4242' },
        city: artisan.city,
        ...overrides,
    };
}

function buildRepairerSubscription(
    retoucheurId: string,
    tier: LocalPlanTier,
    overrides: Partial<Subscription> = {},
): Subscription {
    const retoucheur = mockRepairers.find((r) => r.id === retoucheurId);
    if (!retoucheur) throw new Error(`Unknown retoucheur ${retoucheurId}`);
    const mrr = LOCAL_PRICES[tier];
    return {
        id: `sub-rtc-${retoucheurId}`,
        subscriberKind: 'repairer',
        subscriberId: retoucheurId,
        displayName: retoucheur.atelierName ?? retoucheur.displayName,
        tier,
        plus: false,
        status: tier === 'free' ? 'active' : 'active',
        mrrEur: mrr,
        startedAt: retoucheur.joinedAt,
        nextBillingAt: iso(20 * DAY),
        lastChargeAt: tier === 'free' ? undefined : iso(-10 * DAY),
        paymentMethod: { brand: 'mastercard', last4: '5588' },
        city: retoucheur.city,
        ...overrides,
    };
}

export const mockSubscriptions: readonly Subscription[] = [
    buildArtisanSubscription('art-marie'),
    buildArtisanSubscription('art-theo', {
        paymentMethod: { brand: 'amex', last4: '1003' },
        nextBillingAt: iso(7 * DAY),
        lastChargeAt: iso(-23 * DAY),
    }),
    buildArtisanSubscription('art-claire', {
        status: 'past_due',
        dunningAttempts: 1,
        nextBillingAt: iso(-3 * DAY),
        lastChargeAt: iso(-33 * DAY),
        paymentMethod: { brand: 'cb', last4: '0011' },
    }),
    buildArtisanSubscription('art-paul'),
    buildArtisanSubscription('art-amelie', {
        status: 'trialing',
        mrrEur: 0,
        lastChargeAt: undefined,
        nextBillingAt: iso(11 * DAY),
    }),
    buildArtisanSubscription('art-nicolas'),
    buildArtisanSubscription('art-leila', {
        status: 'past_due',
        dunningAttempts: 2,
        nextBillingAt: iso(-8 * DAY),
        lastChargeAt: iso(-38 * DAY),
    }),
    buildArtisanSubscription('art-jules'),
    buildArtisanSubscription('art-soraya', {
        status: 'canceled',
        nextBillingAt: iso(-2 * DAY),
        lastChargeAt: iso(-32 * DAY),
    }),
    buildArtisanSubscription('art-romain'),
    buildArtisanSubscription('art-pauline'),
    buildArtisanSubscription('art-maison-laurens', {
        paymentMethod: { brand: 'visa', last4: '9012' },
    }),

    buildRepairerSubscription('rtc-mehdi', 'local'),
    buildRepairerSubscription('rtc-002', 'free'),
    buildRepairerSubscription('rtc-003', 'local'),
    buildRepairerSubscription('rtc-004', 'local'),
    buildRepairerSubscription('rtc-005', 'free'),
    buildRepairerSubscription('rtc-007', 'local', {
        status: 'past_due',
        dunningAttempts: 1,
        nextBillingAt: iso(-5 * DAY),
    }),
    buildRepairerSubscription('rtc-008', 'local'),
    buildRepairerSubscription('rtc-009', 'local'),
    buildRepairerSubscription('rtc-011', 'local'),
    buildRepairerSubscription('rtc-014', 'free'),
] as const;

export interface MrrPoint {
    month: string;
    label: string;
    solo: number;
    studio: number;
    maison: number;
    plus: number;
    local: number;
}

export const mockMrrTrajectory: readonly MrrPoint[] = [
    { month: '2025-11', label: 'nov', solo: 145, studio: 158, maison: 149, plus: 38, local: 38 },
    { month: '2025-12', label: 'déc', solo: 174, studio: 158, maison: 149, plus: 38, local: 57 },
    { month: '2026-01', label: 'janv', solo: 203, studio: 237, maison: 149, plus: 57, local: 76 },
    { month: '2026-02', label: 'févr', solo: 232, studio: 237, maison: 149, plus: 57, local: 95 },
    { month: '2026-03', label: 'mars', solo: 232, studio: 316, maison: 149, plus: 76, local: 114 },
    { month: '2026-04', label: 'avr', solo: 232, studio: 316, maison: 149, plus: 76, local: 133 },
] as const;

const FAILURE_REASONS = ['card_declined', 'insufficient_funds', 'expired_card', 'authentication_required'];

function buildPayments(): PaymentEvent[] {
    const out: PaymentEvent[] = [];
    let counter = 0;

    for (const sub of mockSubscriptions) {
        if (sub.tier === 'free') continue;
        for (let i = 12; i >= 1; i--) {
            counter += 1;
            const dayJitter = (counter * 7) % 5;
            const monthOffset = -i * 30 * DAY + dayJitter * DAY;
            const chargedAt = iso(monthOffset);

            const isLastFailure = sub.status === 'past_due' && i === 1 && (sub.dunningAttempts ?? 0) >= 1;
            const random = (counter * 9301 + 49297) % 233280;
            const failureRoll = random / 233280 < 0.05;

            const status: PaymentEvent['status'] = isLastFailure || failureRoll ? 'failed' : 'succeeded';

            out.push({
                id: `pay-${sub.id}-${i}-${counter}`,
                subscriptionId: sub.id,
                subscriberKind: sub.subscriberKind,
                subscriberId: sub.subscriberId,
                displayName: sub.displayName,
                amountEur: sub.mrrEur,
                status,
                chargedAt,
                failureReason: status === 'failed' ? FAILURE_REASONS[counter % FAILURE_REASONS.length] : undefined,
            });
        }
    }
    return out.sort((a, b) => b.chargedAt.localeCompare(a.chargedAt));
}

export const mockPaymentHistory: readonly PaymentEvent[] = buildPayments();

export function subscriptionForTier(tier: SubscriptionTier): readonly Subscription[] {
    return mockSubscriptions.filter((s) => s.tier === tier);
}

export function subscriptionById(id: string): Subscription | undefined {
    return mockSubscriptions.find((s) => s.id === id);
}
