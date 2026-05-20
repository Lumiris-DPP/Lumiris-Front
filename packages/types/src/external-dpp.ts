import type { CountryCode } from './passport';

export type ExternalDppSector = 'electronics' | 'appliance' | 'furniture' | 'battery' | 'toy' | 'textile';

export interface ExternalDppMaterial {
    name: string;
    percentage: number;
    recycledShare?: number;
}

export interface ExternalDppCertification {
    name: string;
    issuer: string;
    validUntil?: string;
}

export interface ExternalDppOrigin {
    country: CountryCode;
    region?: string;
}

export interface ExternalDpp {
    source: 'external-espr';
    emitter: string;
    gtin: string;
    serial?: string;
    sector: ExternalDppSector;
    productName: string;
    brand: string;
    manufacturedAt: string;
    origin: ExternalDppOrigin;
    materials: readonly ExternalDppMaterial[];
    certifications: readonly ExternalDppCertification[];
    warrantyMonths?: number;
    repairabilityIndex?: number;
    carbonFootprintKg?: number;
}
