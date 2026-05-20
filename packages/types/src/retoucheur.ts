import type { FrenchRegion } from './artisan';
import type { CertificationRef } from './certificate';
import type { Coordinates } from './passport';

export type RepairerSpecialty =
    | 'alteration'
    | 'embroidery'
    | 'shoe-repair'
    | 'leather'
    | 'lining'
    | 'electronics-repair'
    | 'phone-repair'
    | 'computer-repair'
    | 'cabinetmaking'
    | 'upholstery'
    | 'appliance-repair';

export type RepairerSector = 'textile' | 'electronics' | 'furniture' | 'appliance';

export const SPECIALTY_TO_SECTOR: Record<RepairerSpecialty, RepairerSector> = {
    alteration: 'textile',
    embroidery: 'textile',
    'shoe-repair': 'textile',
    leather: 'textile',
    lining: 'textile',
    'electronics-repair': 'electronics',
    'phone-repair': 'electronics',
    'computer-repair': 'electronics',
    cabinetmaking: 'furniture',
    upholstery: 'furniture',
    'appliance-repair': 'appliance',
};

export interface RepairerPriceRange {
    min: number;
    max: number;
    currency: 'EUR';
}

export interface Repairer {
    id: string;
    displayName: string;
    atelierName?: string;
    city: string;
    region: FrenchRegion;
    distanceKm?: number;
    coordinates?: Coordinates;
    specialities: readonly RepairerSpecialty[];
    certifications: readonly CertificationRef[];
    avgRating: number;
    reviewCount: number;
    avgDelayDays: number;
    priceRange: RepairerPriceRange;
    localSubscribed: boolean;
    joinedAt: string;
    phone?: string;
    email?: string;
}
