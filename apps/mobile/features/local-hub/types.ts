import type { FrenchRegion, IrisGrade, RepairerSector } from '@lumiris/types';

export type LocalPointKind = 'artisan' | 'repairer';

export interface LocalPoint {
    kind: LocalPointKind;
    id: string;
    slug: string;
    name: string;
    city: string;
    region: FrenchRegion;
    coords?: { lat: number; lng: number };
    distanceKm?: number;
    photoUrl?: string;
    averageGrade?: IrisGrade;
    publishedPassports?: number;
    rating?: number;
    reviewCount?: number;
    avgDelayDays?: number;
    priceRange?: { min: number; max: number };
    specialties?: readonly string[];
    sector?: RepairerSector;
}
