import { ATELIER_PLANS } from '@lumiris/mock-data';
import type { ArtisanTier, AtelierPlanTier } from '@lumiris/types';

export const TIER_TO_PLAN: Record<ArtisanTier, AtelierPlanTier> = {
    Solo: 'solo',
    Studio: 'studio',
    Maison: 'maison',
};

export const TIER_RANK: Record<ArtisanTier, number> = {
    Solo: 1,
    Studio: 2,
    Maison: 3,
};

export function isDowngrade(current: ArtisanTier, target: ArtisanTier): boolean {
    return TIER_RANK[target] < TIER_RANK[current];
}

export { ATELIER_PLANS };
