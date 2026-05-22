import type { ArtisanTier } from '@lumiris/types';

export const HEALTH_OPTIONS = [
    { value: 'all', label: 'Santé : tous' },
    { value: 'lt50', label: 'Santé < 50' },
    { value: 'gte80capacity', label: 'À 80 % du plafond' },
] as const;

export const TIER_TONE: Record<ArtisanTier, string> = {
    Solo: 'border-lumiris-amber/40 text-lumiris-amber',
    Studio: 'border-lumiris-cyan/40 text-lumiris-cyan',
    Maison: 'border-lumiris-emerald/40 text-lumiris-emerald',
};

export const LABEL_BADGES = {
    epv: { label: 'EPV', tone: 'border-lumiris-emerald/40 text-lumiris-emerald' },
    ofg: { label: 'OFG', tone: 'border-lumiris-amber/40 text-lumiris-amber' },
} as const;

export type HealthFilter = (typeof HEALTH_OPTIONS)[number]['value'];
