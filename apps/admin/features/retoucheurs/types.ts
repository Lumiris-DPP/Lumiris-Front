export type CandidatureStatus = 'pending' | 'verified' | 'rejected';

// Abonnement LUMIRIS Local — souscrit/payé par le retoucheur.
export type LocalSubscriptionStatus = 'active' | 'paused' | 'overdue' | 'none';
export type LocalSubscriptionPlan = 'monthly' | 'yearly';

export interface LocalSubscription {
    status: LocalSubscriptionStatus;
    plan: LocalSubscriptionPlan | null;
    /** ISO date du prochain prélèvement, ou null si non applicable. */
    nextBillingAt: string | null;
}

// Surcouche éditable côté admin (en mémoire — futur backend).
export interface RetoucheurOverlay {
    candidatureStatus?: CandidatureStatus;
    rejectReason?: string;
    /** id → raison de masquage (≥ 20 chars). */
    hiddenReviewReasons?: Readonly<Record<string, string>>;
    /** Surcouche sur l'abonnement Local (priorité sur les défauts dérivés du mock). */
    subscriptionOverride?: Partial<LocalSubscription>;
}

// Mise en relation (commission affiliation retouche) — vue lecture seule dans l'onglet Commissions.
interface CommissionEntry {
    id: string;
    occurredAt: string;
    /** id user VISION — anonymisé après {@link COMMISSION_ANONYMIZE_AFTER_DAYS} jours. */
    userId: string;
    /** Type de commission : forfait fixe ou pourcentage du devis. */
    kind: 'flat' | 'pct';
    /** Pour kind='pct', pourcentage appliqué (ex. 8). */
    percent?: number;
    amountEur: number;
    payoutStatus: 'pending' | 'paid' | 'cancelled';
}
