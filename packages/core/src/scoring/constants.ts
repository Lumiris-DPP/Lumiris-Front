// constantes Iris V2 - toute valeur est un brand commitment, modifier un poids change la promesse LUMIRIS

import type { Passport, Fiber } from '@lumiris/types';
import type { ScoreWeights } from '@lumiris/types';

export const LUMIRIS_WEIGHTS: ScoreWeights = {
    transparency: 0.4,
    craftsmanship: 0.25,
    impact: 0.25,
    repairability: 0.1,
} as const;

/** Coefficients carbone (kg CO₂e/kg) - sources ADEME Base Empreinte 2024 + Higg MSI v3.5. */
export const FIBER_IMPACT_COEFFICIENTS: Record<Fiber, number> = {
    wool: 22,
    linen: 0.5,
    cotton: 5,
    silk: 18,
    hemp: 0.4,
    leather: 17,
    cashmere: 28,
    'recycled-polyester': 2.4,
    other: 8,
} as const;

/** Coefficients eau (L/kg) - sources Water Footprint Network + ADEME 2024. */
export const FIBER_WATER_COEFFICIENTS: Record<Fiber, number> = {
    wool: 600,
    linen: 200,
    cotton: 8000,
    silk: 4000,
    hemp: 150,
    leather: 17000,
    cashmere: 6500,
    'recycled-polyester': 50,
    other: 3000,
} as const;

export const IMPACT_BASELINE = {
    carbonCeilingKg: 12,
    waterCeilingLiters: 3000,
    recycledTargetPct: 50,
    transportCeilingKm: 2000,
} as const;

export interface RequiredFieldCheck {
    path: string;
    isPresent: (passport: Passport) => boolean;
}

const isNonEmpty = (s: string | undefined | null): boolean => !!s && s.trim().length > 0;
const isPositive = (n: number | undefined | null): boolean => typeof n === 'number' && Number.isFinite(n) && n > 0;

export const ESPR_REQUIRED_FIELDS: readonly RequiredFieldCheck[] = [
    {
        path: 'garment.kind',
        isPresent: (p) => isNonEmpty(p.garment?.kind as string),
    },
    {
        path: 'garment.reference',
        isPresent: (p) => isNonEmpty(p.garment?.reference),
    },
    {
        path: 'garment.mainPhotoUrl',
        isPresent: (p) => isNonEmpty(p.garment?.mainPhotoUrl),
    },
    {
        path: 'materials[].fiber',
        isPresent: (p) => p.materials.length > 0 && p.materials.every((m) => isNonEmpty(m.fiber as string)),
    },
    {
        path: 'materials[].percentage',
        isPresent: (p) =>
            p.materials.length > 0 &&
            p.materials.every((m) => isPositive(m.percentage)) &&
            Math.abs(p.materials.reduce((s, m) => s + m.percentage, 0) - 100) < 1,
    },
    {
        path: 'materials[].originCountry',
        isPresent: (p) => p.materials.length > 0 && p.materials.every((m) => isNonEmpty(m.originCountry)),
    },
    {
        path: 'steps[]',
        isPresent: (p) => p.steps.length > 0,
    },
    {
        path: 'warranty.durationMonths',
        isPresent: (p) => isPositive(p.warranty?.durationMonths),
    },
    {
        path: 'warranty.terms',
        isPresent: (p) => isNonEmpty(p.warranty?.terms),
    },
] as const;

export const AGEC_REQUIRED_FIELDS: readonly RequiredFieldCheck[] = [
    {
        path: 'materials[].supplierId',
        isPresent: (p) => p.materials.length > 0 && p.materials.every((m) => isNonEmpty(m.supplierId)),
    },
    {
        path: 'materials[].originCountry',
        isPresent: (p) => p.materials.length > 0 && p.materials.every((m) => isNonEmpty(m.originCountry)),
    },
    {
        path: 'gs1.verificationUrl',
        isPresent: (p) => isNonEmpty(p.gs1?.verificationUrl),
    },
    {
        path: 'care.washing',
        isPresent: (p) => p.status !== 'Published' || (!!p.care && isNonEmpty(p.care.washing)),
    },
] as const;
