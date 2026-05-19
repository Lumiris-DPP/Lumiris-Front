// types billing & affiliation côté admin

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
    /** Foreign key - `Artisan.id` or `Repairer.id`. */
    subscriberId: string;
    /** Denormalised display label : "Atelier de Marie", "Retouche Express". */
    displayName: string;
    /** Required only for artisan subs : human-readable atelier tier (Solo / Studio / Maison). */
    artisanTier?: ArtisanTier;
    /** Plan technique : `solo | studio | maison | free | local`. */
    tier: SubscriptionTier;
    /** ATELIER+ add-on (artisan only). */
    plus: boolean;
    status: SubscriptionStatus;
    /** Monthly recurring revenue including add-ons. */
    mrrEur: number;
    /** ISO date - when the subscription was first created. */
    startedAt: string;
    /** ISO date - next renewal / charge attempt. */
    nextBillingAt: string;
    /** ISO date - last successful charge (undefined if never charged). */
    lastChargeAt?: string;
    paymentMethod: PaymentMethodMock;
    city: string;
    /** Number of dunning attempts already made (resets on success). */
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
    /** ISO date. */
    chargedAt: string;
    failureReason?: string;
}

export type AffiliationKind = 'purchase' | 'repair_booking';
export type AffiliationPayoutStatus = 'pending' | 'paid' | 'cancelled';
export type AffiliationBeneficiaryKind = 'artisan' | 'repairer';

export interface AffiliationEvent {
    id: string;
    kind: AffiliationKind;
    /** ISO date - when the conversion happened. */
    occurredAt: string;
    /** Mock vision-user id. > 30d after `occurredAt` → anonymise to `user_anon_xxx` in UI. */
    userId: string;
    beneficiaryKind: AffiliationBeneficiaryKind;
    /** Foreign key - `Artisan.id` or `Repairer.id`. */
    beneficiaryId: string;
    beneficiaryDisplayName: string;
    /** Transaction value in euros (purchase amount, repair quote). */
    transactionAmountEur: number;
    /** Either a percent (`type='pct'`) or a fixed amount (`type='flat'`). */
    commission: { type: 'pct'; percent: number; amountEur: number } | { type: 'flat'; amountEur: number };
    payoutStatus: AffiliationPayoutStatus;
    /** Linked passport (purchase only) - opens the inspector when clicked. */
    passportId?: string;
    /** Manual flag from the anti-fraud view. */
    flaggedAsFraud?: boolean;
    fraudReason?: string;
}

export type PayoutStatus = 'pending' | 'prepared' | 'paid';

export interface Payout {
    id: string;
    /** ISO month `YYYY-MM`. */
    period: string;
    status: PayoutStatus;
    /** ISO date - when the payout was prepared (signed off). */
    preparedAt?: string;
    /** ISO date - when the payout actually settled. */
    paidAt?: string;
    totalEur: number;
    beneficiaryCount: number;
    /** Event ids that were excluded from the payout (fraud, manual review). */
    excludedEventIds: readonly string[];
}
