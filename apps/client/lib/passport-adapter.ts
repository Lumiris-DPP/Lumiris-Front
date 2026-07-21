import type { DppFormDto, DppFormSummaryDto, DppStatus } from '@lumiris/api-client';
import type {
    CareInstructionCode,
    Fiber,
    GarmentCategory,
    GarmentKind,
    Passport,
    PassportStatus,
} from '@lumiris/types';
import type { DraftPassport } from './draft-store';

export { draftToPassport } from './draft-store';

/** Maps a backend product category onto the local garment taxonomy. */
const CATEGORY_TO_KIND: Record<string, GarmentKind> = {
    top: 'sweater',
    bottom: 'trouser',
    dress: 'other',
    outerwear: 'jacket',
    shoe: 'shoe',
    accessory: 'accessory',
    other: 'other',
};

/** Faithful 3-way mapping of the backend DPP lifecycle onto the local passport status. */
const DPP_STATUS_TO_PASSPORT: Record<DppStatus, PassportStatus> = {
    VALID: 'Published',
    DRAFT: 'Draft',
    INVALID: 'InCompletion',
};

export function passportStatusFromDpp(status: DppStatus): PassportStatus {
    return DPP_STATUS_TO_PASSPORT[status] ?? 'InCompletion';
}

/**
 * Lightweight adapter from a DPP list-summary (GET /api/dpp-forms) into a `Passport`.
 * Carries enough for counts, status and list rows; enrich with {@link dppToPassport}
 * once the full DPP is loaded when accurate scoring is needed.
 */
export function dppSummaryToPassport(dpp: DppFormSummaryDto, artisanId: string): Passport {
    return {
        id: dpp.id,
        gs1: { gtin: '', serial: dpp.id, verificationUrl: '' },
        status: passportStatusFromDpp(dpp.status),
        createdAt: dpp.createdAt,
        updatedAt: dpp.createdAt,
        artisanId,
        garment: {
            kind: CATEGORY_TO_KIND[dpp.productCategory ?? ''] ?? 'other',
            name: dpp.productName ?? undefined,
            reference: dpp.sku ?? dpp.id,
            mainPhotoUrl: '',
            dimensions: {},
            retailPrice: 0,
            currency: 'EUR',
        },
        materials: [],
        steps: [],
        certifications: [],
        warranty: { durationMonths: 0, terms: '' },
    };
}

/**
 * Adapts a backend DPP form DTO into the local `Passport` model used by the
 * scoring engine and detail/preview views. Single source of truth for this
 * mapping — do not re-implement it per feature.
 */
export function dppToPassport(dpp: DppFormDto, artisanId: string): Passport {
    return {
        id: dpp.id,
        gs1: { gtin: dpp.gtin ?? '', serial: dpp.id, verificationUrl: '' },
        status: dpp.status === 'VALID' ? 'Published' : 'InCompletion',
        createdAt: dpp.createdAt,
        updatedAt: dpp.createdAt,
        artisanId,
        garment: {
            kind: CATEGORY_TO_KIND[dpp.productCategory ?? ''] ?? 'other',
            name: dpp.productName ?? undefined,
            reference: dpp.sku ?? dpp.id,
            mainPhotoUrl: dpp.mainPhotoUrl ?? '',
            dimensions: {},
            retailPrice: 0,
            currency: 'EUR',
            description: dpp.productDescription ?? undefined,
            originCountry: dpp.originCountry ?? undefined,
            availableSizes: dpp.availableSizes ?? undefined,
            colors: dpp.colors ?? undefined,
        },
        materials: (dpp.materials ?? []).map((m) => ({
            fiber: m.fiber as Passport['materials'][number]['fiber'],
            percentage: m.percentage,
            supplierId: '',
            originCountry: m.originCountry ?? '',
            certifications: [],
        })),
        steps: [],
        certifications: [],
        warranty: { durationMonths: 0, terms: dpp.warrantyDescription ?? '' },
        recycledPct: dpp.recycledPct ?? undefined,
    };
}

/**
 * Reverse mapping: fills a local wizard draft from a backend DRAFT so it can be
 * edited. Uploaded files aren't recoverable as `File` objects and are left out —
 * the backend keeps existing documents when the PUT re-sends none.
 */
export function dppToDraftFields(dpp: DppFormDto): Partial<DraftPassport> {
    return {
        garment: {
            kind: CATEGORY_TO_KIND[dpp.productCategory ?? ''] ?? 'other',
            name: dpp.productName ?? undefined,
            reference: dpp.sku ?? '',
            mainPhotoUrl: dpp.mainPhotoUrl ?? '',
            dimensions: {},
            retailPrice: 0,
            currency: 'EUR',
            description: dpp.productDescription ?? undefined,
            category: (dpp.productCategory as GarmentCategory | null) ?? undefined,
            originCountry: dpp.originCountry ?? undefined,
            availableSizes: dpp.availableSizes ?? undefined,
            colors: dpp.colors ?? undefined,
        },
        materials: (dpp.materials ?? []).map((m) => ({
            fiber: m.fiber as Fiber,
            percentage: m.percentage,
            originCountry: m.originCountry ?? '',
        })),
        careInstructions: (dpp.careInstructions ?? []) as CareInstructionCode[],
        careNotes: dpp.careNotes ?? '',
        traceability: {
            manufacturedAt: dpp.manufacturedAt ?? new Date().toISOString().slice(0, 10),
            batchNumber: dpp.batchNumber ?? undefined,
            gtin: dpp.gtin ?? undefined,
            sku: dpp.sku ?? undefined,
            reachCompliant: dpp.reachCompliant ?? false,
        },
        eco: {
            recycledPct: dpp.recycledPct ?? undefined,
            warrantyDescription: dpp.warrantyDescription ?? undefined,
            isRepairable: dpp.isRepairable ?? undefined,
            endOfLifeInstructions: dpp.endOfLifeInstructions ?? undefined,
        },
    };
}
