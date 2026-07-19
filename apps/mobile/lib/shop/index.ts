// Métadonnées catalogue partagées (libellés + kinds). Depuis LUMIRIS-9, le tri et la
// sélection des pièces sont opérés côté serveur (recherche auditée) ; ce module ne garde
// que le type `ShopItem` et les libellés réutilisés par les cartes mock (discover, passport).

import type { GarmentKind, Passport, ScoreResult } from '@lumiris/types';

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
