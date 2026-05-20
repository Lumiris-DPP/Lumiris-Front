import type { ArtisanTier } from './artisan';
import type { AtelierPlanTier, LocalPlanTier } from './pricing';

export type SubscriberKind = 'artisan' | 'repairer';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'cb';
export type SubscriptionTier = AtelierPlanTier | LocalPlanTier;

export interface PaymentMethodMock {
    brand: CardBrand;
    last4: string;
}

export interface Subscription {
    id: string;
    subscriberKind: SubscriberKind;
    subscriberId: string;
    displayName: string;
    artisanTier?: ArtisanTier;
    tier: SubscriptionTier;
    plus: boolean;
    status: SubscriptionStatus;
    mrrEur: number;
    startedAt: string;
    nextBillingAt: string;
    lastChargeAt?: string;
    paymentMethod: PaymentMethodMock;
    city: string;
    dunningAttempts?: number;
}

export type PaymentStatus = 'succeeded' | 'failed' | 'refunded';

export interface PaymentEvent {
    id: string;
    subscriptionId: string;
    subscriberKind: SubscriberKind;
    subscriberId: string;
    displayName: string;
    amountEur: number;
    status: PaymentStatus;
    chargedAt: string;
    failureReason?: string;
}

export type AffiliationKind = 'purchase' | 'repair_booking';
export type AffiliationPayoutStatus = 'pending' | 'paid' | 'cancelled';
export type AffiliationBeneficiaryKind = 'artisan' | 'repairer';

export interface AffiliationEvent {
    id: string;
    kind: AffiliationKind;
    occurredAt: string;
    /** Anonymised to `user_anon_xxx` in UI when > 30d after `occurredAt`. */
    userId: string;
    beneficiaryKind: AffiliationBeneficiaryKind;
    beneficiaryId: string;
    beneficiaryDisplayName: string;
    transactionAmountEur: number;
    commission: { type: 'pct'; percent: number; amountEur: number } | { type: 'flat'; amountEur: number };
    payoutStatus: AffiliationPayoutStatus;
    passportId?: string;
    flaggedAsFraud?: boolean;
    fraudReason?: string;
}

export type PayoutStatus = 'pending' | 'prepared' | 'paid';

export interface Payout {
    id: string;
    period: string;
    status: PayoutStatus;
    preparedAt?: string;
    paidAt?: string;
    totalEur: number;
    beneficiaryCount: number;
    excludedEventIds: readonly string[];
}
