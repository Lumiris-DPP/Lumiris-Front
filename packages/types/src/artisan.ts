export type ArtisanTier = 'Solo' | 'Studio' | 'Maison';

export type FrenchRegion =
    | 'Auvergne-Rhône-Alpes'
    | 'Bourgogne-Franche-Comté'
    | 'Bretagne'
    | 'Centre-Val de Loire'
    | 'Corse'
    | 'Grand Est'
    | 'Hauts-de-France'
    | 'Île-de-France'
    | 'Normandie'
    | 'Nouvelle-Aquitaine'
    | 'Occitanie'
    | 'Pays de la Loire'
    | "Provence-Alpes-Côte d'Azur";

export interface Artisan {
    id: string;
    displayName: string;
    atelierName: string;
    city: string;
    region: FrenchRegion;
    tier: ArtisanTier;
    plus: boolean;
    epvLabeled: boolean;
    ofgLabeled: boolean;
    specialities: readonly string[];
    story: string;
    photoUrl: string;
    joinedAt: string;
    websiteUrl?: string;
    passportLimit: number;
}

export const ARTISAN_PASSPORT_LIMIT: Record<ArtisanTier, number> = {
    Solo: 50,
    Studio: 300,
    Maison: Number.POSITIVE_INFINITY,
};
