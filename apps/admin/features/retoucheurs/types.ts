export type CandidatureStatus = 'pending' | 'verified' | 'rejected';

export type LocalSubscriptionStatus = 'active' | 'paused' | 'overdue' | 'none';
export type LocalSubscriptionPlan = 'monthly' | 'yearly';

export interface LocalSubscription {
    status: LocalSubscriptionStatus;
    plan: LocalSubscriptionPlan | null;
    nextBillingAt: string | null;
}

// Surcouche en mémoire en attendant le backend.
export interface RetoucheurOverlay {
    candidatureStatus?: CandidatureStatus;
    rejectReason?: string;
    hiddenReviewReasons?: Readonly<Record<string, string>>;
    subscriptionOverride?: Partial<LocalSubscription>;
}

export interface CommissionEntry {
    id: string;
    occurredAt: string;
    /** Anonymisé après {@link COMMISSION_ANONYMIZE_AFTER_DAYS} jours. */
    userId: string;
    kind: 'flat' | 'pct';
    percent?: number;
    amountEur: number;
    payoutStatus: 'pending' | 'paid' | 'cancelled';
}
