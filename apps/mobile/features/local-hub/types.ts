export type LocalPointKind = 'artisan' | 'repairer';

export interface LocalPoint {
    kind: LocalPointKind;
    id: string;
    slug: string;
    name: string;
    city: string;
    region: string;
    coords?: { lat: number; lng: number };
    distanceKm?: number;
    photoUrl?: string;
    rating?: number;
    reviewCount?: number;
    // Retoucheur uniquement : false = fiche annuaire sans compte (CTA doux, pas de RDV direct).
    claimed?: boolean;
    specialties?: readonly string[];
}
