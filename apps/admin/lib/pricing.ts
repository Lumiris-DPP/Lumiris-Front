// Source unique de prix LUMIRIS (Chiffrage v4.2 § 5).
// Aucun montant en € ne doit être hard-codé dans un composant — tout passe par ce module.

export type PriceLineId = 'solo' | 'studio' | 'maison' | 'plus' | 'local';

interface PriceLine {
    id: PriceLineId;
    label: string;
    shortLabel: string;
    monthlyEur: number;
    yearlyEur: number;
    /** CSS variable for legends, charts, badges. */
    color: string;
    kind: 'atelier' | 'addon' | 'local';
}

export const PRICE_LINES = {
    solo: {
        id: 'solo',
        label: 'ATELIER Solo',
        shortLabel: 'Solo',
        monthlyEur: 29,
        yearlyEur: 290,
        color: 'var(--lumiris-cyan)',
        kind: 'atelier',
    },
    studio: {
        id: 'studio',
        label: 'ATELIER Studio',
        shortLabel: 'Studio',
        monthlyEur: 79,
        yearlyEur: 790,
        color: 'var(--lumiris-emerald)',
        kind: 'atelier',
    },
    maison: {
        id: 'maison',
        label: 'ATELIER Maison',
        shortLabel: 'Maison',
        monthlyEur: 149,
        yearlyEur: 1490,
        color: 'var(--lumiris-amber)',
        kind: 'atelier',
    },
    plus: {
        id: 'plus',
        label: 'ATELIER+',
        shortLabel: 'ATELIER+',
        monthlyEur: 19,
        yearlyEur: 190,
        color: 'var(--lumiris-orange)',
        kind: 'addon',
    },
    local: {
        id: 'local',
        label: 'LUMIRIS Local',
        shortLabel: 'Local',
        monthlyEur: 19,
        yearlyEur: 190,
        color: 'var(--lumiris-rose)',
        kind: 'local',
    },
} as const satisfies Record<PriceLineId, PriceLine>;

export const ATELIER_LINE_IDS = ['solo', 'studio', 'maison'] as const satisfies readonly PriceLineId[];
export const ORDERED_PRICE_IDS = [
    'solo',
    'studio',
    'maison',
    'plus',
    'local',
] as const satisfies readonly PriceLineId[];

export function priceLine(id: PriceLineId): PriceLine {
    return PRICE_LINES[id];
}

export function formatEur(amount: number): string {
    return `${amount.toLocaleString('fr-FR')} €`;
}

export function yearlySavingsPct(line: PriceLine): number {
    const cap = line.monthlyEur * 12;
    if (cap === 0) return 0;
    return Math.round((1 - line.yearlyEur / cap) * 100);
}
