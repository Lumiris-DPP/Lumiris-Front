// Source unique des valeurs business (Chiffrage v4.2) — aucun chiffre commercial ne doit être inline dans un composant.

import type { ArtisanTier } from '@lumiris/types';

export const ATELIER_MONTHLY_EUR: Record<ArtisanTier, number> = {
    Solo: 29,
    Studio: 79,
    Maison: 149,
};

export const ATELIER_PLUS_MONTHLY_EUR = 19;

export const LOCAL_MONTHLY_EUR = 19;

// M0 = 2026-01 ; jalons clés : M18 (130 artisans / 25k VISION / 60 Local), M24 (ARR ~400 k€), M36 (ARR ~1 M€).
export const TARGET_PERIOD_START_ISO = '2026-01-01';
export const TARGET_PERIOD_END_MONTHS = 36;

export interface MonthlyTarget {
    readonly monthIndex: number;
    readonly label: string;
    readonly artisans: number;
    readonly visionUsers: number;
    readonly localPaid: number;
}

// Interpolation linéaire entre 5 ancres (M0, M6, M18, M24, M36) — première/dernière extraites pour leur garantir un type défini.
const [FIRST_ANCHOR, ANCHOR_M6, ANCHOR_M18, ANCHOR_M24, LAST_ANCHOR] = [
    { monthIndex: 0, label: 'M0', artisans: 0, visionUsers: 0, localPaid: 0 },
    { monthIndex: 6, label: 'M6', artisans: 35, visionUsers: 3_000, localPaid: 12 },
    { monthIndex: 18, label: 'M18', artisans: 130, visionUsers: 25_000, localPaid: 60 },
    { monthIndex: 24, label: 'M24', artisans: 220, visionUsers: 55_000, localPaid: 110 },
    { monthIndex: 36, label: 'M36', artisans: 420, visionUsers: 140_000, localPaid: 220 },
] as const satisfies readonly [MonthlyTarget, MonthlyTarget, MonthlyTarget, MonthlyTarget, MonthlyTarget];

const TARGET_ANCHORS: readonly MonthlyTarget[] = [FIRST_ANCHOR, ANCHOR_M6, ANCHOR_M18, ANCHOR_M24, LAST_ANCHOR];

function lerp(a: number, b: number, t: number): number {
    return Math.round(a + (b - a) * t);
}

export function buildMonthlyTargets(): readonly MonthlyTarget[] {
    const out: MonthlyTarget[] = [];
    for (let m = 0; m <= TARGET_PERIOD_END_MONTHS; m += 1) {
        const ahead = TARGET_ANCHORS.find((a) => a.monthIndex >= m) ?? LAST_ANCHOR;
        const behind = [...TARGET_ANCHORS].reverse().find((a) => a.monthIndex <= m) ?? FIRST_ANCHOR;
        const span = ahead.monthIndex - behind.monthIndex;
        const t = span === 0 ? 0 : (m - behind.monthIndex) / span;
        out.push({
            monthIndex: m,
            label: `M${m}`,
            artisans: lerp(behind.artisans, ahead.artisans, t),
            visionUsers: lerp(behind.visionUsers, ahead.visionUsers, t),
            localPaid: lerp(behind.localPaid, ahead.localPaid, t),
        });
    }
    return out;
}

export const ARTISAN_TIER_MIX: Record<ArtisanTier, number> = {
    Solo: 0.6,
    Studio: 0.3,
    Maison: 0.1,
};

export const ATELIER_PLUS_ADOPTION_PCT = 0.25;

export const B2C_AFFILIATION_ARPU_MONTHLY_EUR = 0.18;

export const B2C_ACCOUNT_ACTIVATION_PCT = 0.18;

export const CHARGES_CUMULATIVE_M18_EUR = 235_000;

export function monthlyCostEur(monthIndex: number): number {
    if (monthIndex <= 0) return 8_000;
    if (monthIndex <= 9) return 8_000 + (monthIndex / 9) * 6_000;
    if (monthIndex <= 18) return 14_000 + ((monthIndex - 9) / 9) * 4_000;
    return 18_000 + ((monthIndex - 18) / 18) * 4_000;
}

export const STRESS_B2B_FACTOR = 0.7;
export const STRESS_B2C_FACTOR = 0.67;

export const BREAKEVEN_NOMINAL_RANGE: readonly [number, number] = [22, 24];
export const BREAKEVEN_STRESS_RANGE: readonly [number, number] = [28, 30];

type LtvCacSegmentId =
    | 'vision_no_account'
    | 'vision_with_account'
    | 'atelier_solo'
    | 'atelier_studio'
    | 'local_repairer';

interface LtvCacTarget {
    readonly id: LtvCacSegmentId;
    readonly label: string;
    readonly arpuMonthlyEur: number;
    readonly lifetimeMonths: number;
    readonly cacEur: number;
}

export const LTV_CAC_TARGETS: readonly LtvCacTarget[] = [
    {
        id: 'vision_no_account',
        label: 'Utilisateur VISION sans compte',
        arpuMonthlyEur: 0.05,
        lifetimeMonths: 6,
        cacEur: 0.08,
    },
    {
        id: 'vision_with_account',
        label: 'Utilisateur VISION avec compte',
        arpuMonthlyEur: B2C_AFFILIATION_ARPU_MONTHLY_EUR,
        lifetimeMonths: 24,
        cacEur: 1.2,
    },
    {
        id: 'atelier_solo',
        label: 'ATELIER Solo',
        arpuMonthlyEur: ATELIER_MONTHLY_EUR.Solo,
        lifetimeMonths: 30,
        cacEur: 220,
    },
    {
        id: 'atelier_studio',
        label: 'ATELIER Studio',
        arpuMonthlyEur: ATELIER_MONTHLY_EUR.Studio,
        lifetimeMonths: 36,
        cacEur: 540,
    },
    {
        id: 'local_repairer',
        label: 'Retoucheur LUMIRIS Local',
        arpuMonthlyEur: LOCAL_MONTHLY_EUR,
        lifetimeMonths: 24,
        cacEur: 110,
    },
];

export const IRIS_AVERAGE_TARGET = 3.2;

type AcquisitionSource = 'Salon' | 'CMA' | 'Démarchage' | 'LinkedIn' | 'RP';

/** Distribution des leads ATELIER par canal (somme = 1). */
export const ACQUISITION_SOURCE_MIX: Record<AcquisitionSource, number> = {
    Salon: 0.28,
    CMA: 0.22,
    Démarchage: 0.2,
    LinkedIn: 0.18,
    RP: 0.12,
};

/** Taux de conversion étape par étape, cumulés depuis le lead. */
export const FUNNEL_CONVERSION = {
    leadToDemo: 0.45,
    demoToSignature: 0.32,
    signatureToActivation: 0.78,
} as const;

// Dates "estimées" — revérifier contre `regulatory-calendar.ts` à la publication de l'acte délégué textile.
interface EsprDeadline {
    readonly id: string;
    readonly date: string;
    readonly label: string;
    readonly description: string;
}

export const ESPR_DEADLINES: readonly EsprDeadline[] = [
    {
        id: 'espr-registry-open',
        date: '2026-07-19',
        label: 'Registre central DPP',
        description: 'Ouverture de l’infrastructure de vérification européenne.',
    },
    {
        id: 'espr-textile-act',
        date: '2027-01-01',
        label: 'Acte délégué textile',
        description: 'Publication estimée — exigences DPP textile figées.',
    },
    {
        id: 'espr-textile-application',
        date: '2028-07-01',
        label: 'Application textile',
        description: 'Obligations DPP opposables aux metteurs sur le marché.',
    },
];
