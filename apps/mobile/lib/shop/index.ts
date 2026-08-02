// Métadonnées catalogue partagées. Depuis LUMIRIS-9, le tri et la sélection des
// pièces sont opérés côté serveur (recherche auditée) ; ce module ne garde que le
// type `ShopItem` consommé par les cartes mock (discover, passport).

import type { Passport, ScoreResult } from '@lumiris/types';

export interface ShopItem {
    passport: Passport;
    score: ScoreResult;
    artisanName: string;
    isFeatured: boolean;
}
