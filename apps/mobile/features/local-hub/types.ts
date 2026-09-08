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
    specialties?: readonly string[];
}
