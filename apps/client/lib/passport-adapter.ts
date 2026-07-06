import type { DppFormDto } from '@lumiris/api-client';
import type { GarmentKind, Passport } from '@lumiris/types';

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
