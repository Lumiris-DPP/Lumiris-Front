// Marketplace helpers - tri exclusivement par score Iris (règle d'or, spec 5.3).
// Aucun champ `featured` data-side : le boost ATELIER+ est une heuristique
// (« 3 premiers artisans triés par nombre de passeports A »), strictement à
// score équivalent (cf. About).

import { mockArtisans, mockPassports } from '@lumiris/mock-data';
import type { GarmentKind, Passport, ScoreResult } from '@lumiris/types';
import { scorePassport } from '../passport-score';

export interface ShopItem {
    passport: Passport;
    score: ScoreResult;
    artisanName: string;
    isFeatured: boolean;
}

export const SHOP_GARMENT_KINDS: readonly GarmentKind[] = [
    'sweater',
    'shirt',
    'jacket',
    'trouser',
    'shoe',
    'accessory',
    'other',
];

export const GARMENT_KIND_LABEL: Record<GarmentKind, string> = {
    sweater: 'Pulls',
    shirt: 'Chemises',
    jacket: 'Vestes',
    trouser: 'Pantalons',
    shoe: 'Chaussures',
    accessory: 'Accessoires',
    other: 'Autres',
};

// Heuristique ATELIER+ MVP - top 3 artisans par nombre de passeports A.
// Recalculé à chaque appel (déterministe pour un `now` donné).
function computeFeaturedArtisanIds(now: Date): readonly string[] {
    const aCount = new Map<string, number>();
    for (const p of mockPassports) {
        if (p.status !== 'Published') continue;
        if (scorePassport(p, now).grade !== 'A') continue;
        aCount.set(p.artisanId, (aCount.get(p.artisanId) ?? 0) + 1);
    }
    return mockArtisans
        .map((a) => ({ id: a.id, count: aCount.get(a.id) ?? 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((row) => row.id);
}

const SCORE_DESC = (a: ShopItem, b: ShopItem): number => b.score.total - a.score.total;
const FEATURED_DESC = (a: ShopItem, b: ShopItem): number => Number(b.isFeatured) - Number(a.isFeatured);
const NAME_ASC = (a: ShopItem, b: ShopItem): number =>
    a.passport.garment.reference.localeCompare(b.passport.garment.reference, 'fr', { sensitivity: 'base' });

// Tri spec 5.3 : score DESC, isFeatured DESC, nom ASC.
function compareShopItems(a: ShopItem, b: ShopItem): number {
    return SCORE_DESC(a, b) || FEATURED_DESC(a, b) || NAME_ASC(a, b);
}

export function getShopItems(now: Date): readonly ShopItem[] {
    const featuredIds = new Set(computeFeaturedArtisanIds(now));
    const artisanById = new Map(mockArtisans.map((a) => [a.id, a]));
    return mockPassports
        .filter((p) => p.status === 'Published')
        .map<ShopItem>((passport) => ({
            passport,
            score: scorePassport(passport, now),
            artisanName: artisanById.get(passport.artisanId)?.atelierName ?? '-',
            isFeatured: featuredIds.has(passport.artisanId),
        }))
        .sort(compareShopItems);
}

export function getShopItemsByCategory(category: GarmentKind, now: Date): readonly ShopItem[] {
    return getShopItems(now).filter((item) => item.passport.garment.kind === category);
}
