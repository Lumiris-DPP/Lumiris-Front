import type { ArtisanTier, PaymentStatus, SubscriberKind } from '@lumiris/types';
import type { PriceLineId } from '@/lib/pricing';

export type PaymentStatusFilter = PaymentStatus | 'all';
export type SubscriberKindFilter = SubscriberKind | 'all';
export type TierFilterValue = ArtisanTier | PriceLineId | 'all';
export type PaymentPeriodFilter = '30d' | '90d' | '12m' | 'all';
