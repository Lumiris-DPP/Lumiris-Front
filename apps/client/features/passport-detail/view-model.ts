import type { DppFormDto } from '@lumiris/api-client';
import type { Passport } from '@lumiris/types';
import { fiberLabel, garmentCategoryLabel, garmentKindLabel } from '@lumiris/scoring-ui';

const PLACEHOLDER_PHOTO = '/default_product_picture.webp';

export interface DetailView {
    title: string;
    reference: string;
    createdAt: string;
    photo: string;
    /** Backend status, or null when the passport isn't API-sourced. */
    apiStatus: 'DRAFT' | 'VALID' | 'INVALID' | null;

    description?: string | null;
    category?: string | null;
    originCountry?: string | null;
    sizes: string[];
    colors: string[];

    /** `fiber` porte le libellé FR déjà résolu, prêt à afficher. */
    materials: Array<{ fiber: string; percentage: number; originCountry?: string | null }>;
    careInstructions: string[];
    certifications: Array<{ name: string; customName?: string | null; licenseNumber?: string | null }>;

    manufacturedAt?: string | null;
    batchNumber?: string | null;
    gtin?: string | null;
    sku?: string | null;
    reachCompliant?: boolean | null;

    recycledPct?: number | null;
    warranty?: string | null;
    isRepairable?: boolean | null;
    endOfLifeInstructions?: string | null;

    /** Ancrage blockchain (PENDING/ANCHORED/FAILED) — présent uniquement sur un DPP API publié. */
    blockchainAnchorStatus?: string | null;
    blockchainTxHash?: string | null;
}

/**
 * Flattens a passport (+ optional raw backend DTO) into a single display model.
 * All `dpp ?? passport` precedence is resolved here, once, so the view never has
 * to merge field-by-field.
 */
export function buildDetailView(passport: Passport, dpp: DppFormDto | null): DetailView {
    return {
        title: dpp?.productName || passport.garment.name || 'Sans nom',
        reference: passport.garment.reference,
        createdAt: passport.createdAt,
        photo: dpp?.mainPhotoUrl || passport.garment.mainPhotoUrl || PLACEHOLDER_PHOTO,
        apiStatus: dpp ? dpp.status : null,

        description: dpp?.productDescription ?? passport.garment.description,
        // Libellés FR : l'API renvoie les valeurs techniques (`dress`, `cotton`…).
        category: dpp?.productCategory
            ? garmentCategoryLabel(dpp.productCategory)
            : garmentKindLabel(passport.garment.kind),
        originCountry: dpp?.originCountry ?? passport.garment.originCountry,
        sizes: [...(dpp?.availableSizes ?? passport.garment.availableSizes ?? [])],
        colors: [...(dpp?.colors ?? passport.garment.colors ?? [])],

        materials: (dpp?.materials ?? passport.materials).map((m) => ({
            fiber: fiberLabel(String(m.fiber)),
            percentage: m.percentage,
            originCountry: m.originCountry ?? null,
        })),
        careInstructions: [...(dpp?.careInstructions ?? [])],
        certifications: [],

        manufacturedAt: dpp?.manufacturedAt ?? null,
        batchNumber: dpp?.batchNumber ?? null,
        gtin: dpp?.gtin ?? passport.gs1?.gtin ?? null,
        sku: dpp?.sku ?? passport.garment.reference,
        reachCompliant: dpp?.reachCompliant ?? null,

        recycledPct: dpp?.recycledPct ?? passport.recycledPct ?? null,
        warranty: dpp?.warrantyDescription ?? passport.warranty?.terms ?? null,
        isRepairable: dpp?.isRepairable ?? null,
        endOfLifeInstructions: dpp?.endOfLifeInstructions ?? null,

        blockchainAnchorStatus: dpp?.blockchainAnchorStatus ?? null,
        blockchainTxHash: dpp?.blockchainTxHash ?? null,
    };
}
