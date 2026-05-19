// Chiffrage v4.2 — source unique pour toute valeur commerciale rendue dans le Cockpit.
// Tout chiffre business (prix, cible, charge, CAC, ARPU…) DOIT vivre ici, jamais inline
// dans un composant. `grep -E "(290|79|149|290 €|29 €)" apps/admin/features/cockpit/` ne doit
// rien remonter — toute mention passe par les exports ci-dessous.

import type { ArtisanTier } from '@lumiris/types';

// ─── Tarification ATELIER B2B (mensuel HT, EUR) ─────────────────────────────────────────────
// Chiffrage v4.2 § 4 — pricing inchangé depuis le v4.0
export const ATELIER_MONTHLY_EUR: Record<ArtisanTier, number> = {
    Solo: 29,
    Studio: 79,
    Maison: 149,
};

// Add-on ATELIER+ — visibilité annuaire, sans impact score Iris.
export const ATELIER_PLUS_MONTHLY_EUR = 19;

// LUMIRIS Local (retoucheur abonné, hors palier gratuit). Chiffrage v4.2 § 4.
export const LOCAL_MONTHLY_EUR = 19;

// ─── Trajectoire cibles M0 → M36 ─────────────────────────────────────────────────────────────
// Chiffrage v4.2 § 5 — courbe d'adoption à 18, 24 et 36 mois.
// M0 = lancement plateforme (2026-01). Les jalons clés :
//   M18 (2027-06)  → 130 artisans · 25 000 utilisateurs VISION · 60 retoucheurs Local
//   M24 (2027-12)  → ARR ~400 k€
//   M36 (2028-12)  → ARR ~1 M€
export const TARGET_PERIOD_START_ISO = '2026-01-01';
export const TARGET_PERIOD_END_MONTHS = 36;

export interface MonthlyTarget {
    /** Mois écoulés depuis M0 (0 = janvier 2026). */
    readonly monthIndex: number;
    /** Libellé court FR (`M6`, `M18`, …). */
    readonly label: string;
    /** Artisans actifs cumulés (tous tiers confondus). */
    readonly artisans: number;
    /** Utilisateurs VISION cumulés (mix free + payants). */
    readonly visionUsers: number;
    /** Retoucheurs LUMIRIS Local payants. */
    readonly localPaid: number;
}

// Interpolation linéaire entre 5 ancres (M0, M6, M18, M24, M36) — fidèle aux courbes du § 5.
// Premier et dernier élément extraits via déstructuration pour que TS sache qu'ils sont définis.
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

// ─── Mix tier artisans (objectif M18) ────────────────────────────────────────────────────────
// Chiffrage v4.2 § 5 — 60 % Solo · 30 % Studio · 10 % Maison.
export const ARTISAN_TIER_MIX: Record<ArtisanTier, number> = {
    Solo: 0.6,
    Studio: 0.3,
    Maison: 0.1,
};

// Part artisans ayant souscrit l'add-on ATELIER+ (cible M18+).
export const ATELIER_PLUS_ADOPTION_PCT = 0.25;

// ─── Affiliation B2C — ARPU mensuel par utilisateur VISION avec compte ───────────────────────
// Chiffrage v4.2 § 6 — moyenne pondérée commission marchand + revenus partenaires.
// Volontairement faible : modèle « long tail », pas un funnel e-commerce.
export const B2C_AFFILIATION_ARPU_MONTHLY_EUR = 0.18;

// Part des utilisateurs VISION ayant créé un compte (vs scan anonyme).
export const B2C_ACCOUNT_ACTIVATION_PCT = 0.18;

// ─── Charges cumulées (M0 → M18) ─────────────────────────────────────────────────────────────
// Chiffrage v4.2 § 7 — produit + infra + acquisition + RH (~235 k€ sur 18 mois).
export const CHARGES_CUMULATIVE_M18_EUR = 235_000;

// Courbe charges mensuelles (linéaire-ish, accélération M9 quand l'équipe grandit).
export function monthlyCostEur(monthIndex: number): number {
    if (monthIndex <= 0) return 8_000;
    // Rampe douce M0→M9, palier M9→M18, palier supérieur M18+.
    if (monthIndex <= 9) return 8_000 + (monthIndex / 9) * 6_000;
    if (monthIndex <= 18) return 14_000 + ((monthIndex - 9) / 9) * 4_000;
    return 18_000 + ((monthIndex - 18) / 18) * 4_000;
}

// ─── Stress-test ─────────────────────────────────────────────────────────────────────────────
// Chiffrage v4.2 § 8 — scénario prudent : -30 % conversion B2B, -33 % adoption B2C.
export const STRESS_B2B_FACTOR = 0.7;
export const STRESS_B2C_FACTOR = 0.67;

// ─── Point mort prévu ────────────────────────────────────────────────────────────────────────
// Chiffrage v4.2 § 9 — fenêtre nominale vs scénario stressé.
export const BREAKEVEN_NOMINAL_RANGE: readonly [number, number] = [22, 24];
export const BREAKEVEN_STRESS_RANGE: readonly [number, number] = [28, 30];

// ─── LTV / CAC par segment ───────────────────────────────────────────────────────────────────
// Chiffrage v4.2 § 6 — toutes les valeurs sont mensuelles puis annualisées via lifetimeMonths.
export type LtvCacSegmentId =
    | 'vision_no_account'
    | 'vision_with_account'
    | 'atelier_solo'
    | 'atelier_studio'
    | 'local_repairer';

export interface LtvCacTarget {
    readonly id: LtvCacSegmentId;
    readonly label: string;
    /** ARPU mensuel HT en EUR. */
    readonly arpuMonthlyEur: number;
    /** Durée de vie moyenne attendue, en mois. */
    readonly lifetimeMonths: number;
    /** CAC objectif en EUR (acquisition payée + temps commercial alloué). */
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

// Score Iris moyen visé (cible plateforme M18, exprimé sur 5).
export const IRIS_AVERAGE_TARGET = 3.2;

// ─── Acquisition mix B2B ─────────────────────────────────────────────────────────────────────
// Chiffrage v4.2 § 6 — mix canaux retenu pour la phase 0-18M.
export type AcquisitionSource = 'Salon' | 'CMA' | 'Démarchage' | 'LinkedIn' | 'RP';

/** Distribution attendue des leads ATELIER par canal (somme = 1). */
export const ACQUISITION_SOURCE_MIX: Record<AcquisitionSource, number> = {
    Salon: 0.28,
    CMA: 0.22,
    Démarchage: 0.2,
    LinkedIn: 0.18,
    RP: 0.12,
};

/** Taux de conversion étape par étape, en cumulé depuis le lead. */
export const FUNNEL_CONVERSION = {
    leadToDemo: 0.45,
    demoToSignature: 0.32,
    signatureToActivation: 0.78,
} as const;

// ─── ESPR — countdown plateforme ─────────────────────────────────────────────────────────────
// Chiffrage v4.2 § 3 — trois jalons strategiques mis en visuel dans le pied du Cockpit.
// Les dates "estimées" suivent la projection LUMIRIS, à reverifier contre `regulatory-calendar.ts`
// quand l'acte délégué textile est officiellement publié.
export interface EsprDeadline {
    readonly id: string;
    /** ISO `YYYY-MM-DD`. */
    readonly date: string;
    readonly label: string;
    /** Court — affiché en sous-titre du compteur. */
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
