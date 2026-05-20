import type { CertificationRef } from './certificate';

export type GS1DigitalLink = string;

export interface GS1Identifier {
    gtin: string;
    serial: string;
    verificationUrl: string;
    nfcSerial?: string;
}

export interface Coordinates {
    lat: number;
    lng: number;
}

export type PassportStatus = 'Draft' | 'InCompletion' | 'Published';

export type Fiber =
    | 'wool'
    | 'linen'
    | 'cotton'
    | 'silk'
    | 'hemp'
    | 'leather'
    | 'cashmere'
    | 'recycled-polyester'
    | 'other';

export type CountryCode = string;

export interface Material {
    fiber: Fiber;
    percentage: number;
    supplierId: string;
    originCountry: CountryCode;
    certifications: readonly CertificationRef[];
    invoiceRef?: string;
}

export type StageKind =
    | 'weaving'
    | 'dyeing'
    | 'cutting'
    | 'sewing'
    | 'finishing'
    | 'embroidery'
    | 'assembly'
    | 'quality-check'
    | 'other';

export interface ProductionStep {
    id: string;
    kind: StageKind;
    label: string;
    performedBy: string;
    locationCity: string;
    locationCountry: CountryCode;
    photos: readonly string[];
    performedAt?: string;
}

export type GarmentKind = 'sweater' | 'shirt' | 'shoe' | 'jacket' | 'trouser' | 'accessory' | 'other';
/** @deprecated utiliser {@link GarmentKind}. */
export type ProductKind = GarmentKind;

export interface GarmentDimensions {
    length?: number;
    width?: number;
    height?: number;
    weightG?: number;
}
/** @deprecated utiliser {@link GarmentDimensions}. */
export type ProductDimensions = GarmentDimensions;

export interface GarmentInfo {
    kind: GarmentKind;
    reference: string;
    mainPhotoUrl: string;
    dimensions: GarmentDimensions;
    retailPrice: number;
    currency: 'EUR';
}
/** @deprecated utiliser {@link GarmentInfo}. */
export type ProductInfo = GarmentInfo;

export interface PassportWarranty {
    durationMonths: number;
    terms: string;
    repairabilityCommitment?: string;
}

export interface CareInstructions {
    washing: string;
    drying: string;
    ironing: string;
    storage: string;
}

export type ModerationStatus = 'PendingReview' | 'Approved' | 'Rejected';

export interface PassportModeration {
    status: ModerationStatus;
    reviewerId: string;
    reviewedAt: string;
    notes?: string;
}

export interface Passport {
    id: string;
    gs1: GS1Identifier;
    status: PassportStatus;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    artisanId: string;
    garment: GarmentInfo;
    materials: readonly Material[];
    steps: readonly ProductionStep[];
    certifications: readonly CertificationRef[];
    warranty: PassportWarranty;
    moderation?: PassportModeration;
    care?: CareInstructions;
    carbonKg?: number;
    waterLiters?: number;
    recycledPct?: number;
    transportKm?: number;
}

export function buildGS1DigitalLink(gtin: string, serial: string): GS1DigitalLink {
    return `https://id.lumiris.fr/01/${gtin}/21/${serial}`;
}

export function buildGS1Identifier(gtin: string, serial: string, slug: string = serial): GS1Identifier {
    return {
        gtin,
        serial,
        verificationUrl: `https://lumiris.fr/passeport/${slug}`,
    };
}
