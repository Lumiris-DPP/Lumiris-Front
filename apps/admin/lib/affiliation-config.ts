// Source unique des taux d'affiliation (Chiffrage v4.2 § 7) — toute modification est audit-loguée via `affiliation.rate_change`.

export type ProductCategory = 'leather' | 'textile' | 'jewelry' | 'shoes' | 'other';

export interface PurchaseRate {
    category: ProductCategory;
    label: string;
    percent: number;
}

// Bornes légales — cadre Pratiques Loyales FR + chiffrage v4.2 § 7.1.
export const PURCHASE_RATE_BOUNDS = { min: 3, max: 7 } as const;
export const REPAIR_FLAT_BOUNDS = { min: 4, max: 10 } as const;
export const REPAIR_PCT_BOUNDS = { min: 6, max: 10 } as const;

export const DEFAULT_PURCHASE_RATES: readonly PurchaseRate[] = [
    { category: 'leather', label: 'Maroquinerie', percent: 5 },
    { category: 'textile', label: 'Textile & confection', percent: 4 },
    { category: 'jewelry', label: 'Bijoux & accessoires', percent: 6 },
    { category: 'shoes', label: 'Chaussures', percent: 5 },
    { category: 'other', label: 'Autres', percent: 4 },
];

export type RepairCommissionMode = 'flat' | 'pct';

export interface RepairCommission {
    mode: RepairCommissionMode;
    flatEur: number;
    pct: number;
}

export const DEFAULT_REPAIR_COMMISSION: RepairCommission = { mode: 'flat', flatEur: 5, pct: 8 };

export const RATE_CHANGE_REASON_MIN_LENGTH = 30;

interface ValidationError {
    field: 'purchase' | 'repair-flat' | 'repair-pct';
    min: number;
    max: number;
    received: number;
    message: string;
}

export function validatePurchaseRate(percent: number): ValidationError | null {
    const { min, max } = PURCHASE_RATE_BOUNDS;
    if (!Number.isFinite(percent) || percent < min || percent > max) {
        return {
            field: 'purchase',
            min,
            max,
            received: percent,
            message: `Hors fourchette légale ${min}-${max} %`,
        };
    }
    return null;
}

export function validateRepairFlat(eur: number): ValidationError | null {
    const { min, max } = REPAIR_FLAT_BOUNDS;
    if (!Number.isFinite(eur) || eur < min || eur > max) {
        return {
            field: 'repair-flat',
            min,
            max,
            received: eur,
            message: `Forfait hors fourchette ${min}-${max} €`,
        };
    }
    return null;
}

export function validateRepairPct(percent: number): ValidationError | null {
    const { min, max } = REPAIR_PCT_BOUNDS;
    if (!Number.isFinite(percent) || percent < min || percent > max) {
        return {
            field: 'repair-pct',
            min,
            max,
            received: percent,
            message: `Pourcentage hors fourchette ${min}-${max} %`,
        };
    }
    return null;
}
