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
