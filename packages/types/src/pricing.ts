export type AtelierPlanTier = 'solo' | 'studio' | 'maison';

export interface AtelierPlan {
    tier: AtelierPlanTier;
    label: string;
    monthlyEur: number;
    yearlyEur: number;
    /** `null` = illimité. */
    maxPassports: number | null;
    /** `null` = illimité. */
    maxSeats: number | null;
    popular?: boolean;
    tagline: string;
    features: readonly string[];
}

export type AtelierAddOnId = 'atelier-plus';

export interface AtelierAddOn {
    id: AtelierAddOnId;
    label: string;
    monthlyEur: number;
    yearlyEur: number;
    description: string;
}

export type LocalPlanTier = 'free' | 'local';

export interface LocalPlan {
    tier: LocalPlanTier;
    label: string;
    monthlyEur: number;
    yearlyEur: number;
    description: string;
}
