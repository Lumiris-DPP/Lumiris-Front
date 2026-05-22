import type { ArtisanTier, PaymentStatus, SubscriberKind, SubscriptionStatus } from '@lumiris/types';
import type { PriceLineId } from '@/lib/pricing';

export type SubscriptionStatusFilter = SubscriptionStatus | 'all';
export type PaymentStatusFilter = PaymentStatus | 'all';
export type SubscriberKindFilter = SubscriberKind | 'all';
export type TierFilterValue = ArtisanTier | PriceLineId | 'all';
export type PlusFilter = 'all' | 'on' | 'off';
export type PaymentPeriodFilter = '30d' | '90d' | '12m' | 'all';
