import { z } from 'zod';

export const dppStatusSchema = z.enum(['VALID', 'INVALID']);
export type DppStatus = z.infer<typeof dppStatusSchema>;

export const dppMaterialSchema = z.object({
    fiber: z.string(),
    percentage: z.number(),
    originCountry: z.string().nullish(),
});
export type DppMaterial = z.infer<typeof dppMaterialSchema>;

export const dppFormPayloadSchema = z.object({
    productName: z.string().nullish(),
    productDescription: z.string().nullish(),
    productCategory: z.string().nullish(),
    originCountry: z.string().nullish(),
    availableSizes: z.array(z.string()).nullish(),
    colors: z.array(z.string()).nullish(),
    materials: z.array(dppMaterialSchema).nullish(),
    careInstructions: z.array(z.string()).nullish(),
    careNotes: z.string().nullish(),
    manufacturedAt: z.string().nullish(),
    batchNumber: z.string().nullish(),
    gtin: z.string().nullish(),
    sku: z.string().nullish(),
    reachCompliant: z.boolean().nullish(),
    recycledPct: z.number().nullish(),
    warrantyDescription: z.string().nullish(),
    isRepairable: z.boolean().nullish(),
    endOfLifeInstructions: z.string().nullish(),
    quantity: z.number().int().min(1).nullish(),
});
export type DppFormPayload = z.infer<typeof dppFormPayloadSchema>;

export const DPP_FILE_PARTS = [
    'productPhoto',
    'reachCompliance',
    'euDeclaration',
    'testReports',
    'transactionCerts',
    'originCerts',
    'repairManual',
    'careGuide',
    'endOfLifeGuide',
    'saleInvoice',
    'creationPassport',
] as const;
export type DppFilePart = (typeof DPP_FILE_PARTS)[number];

// Mirrors the backend DocumentType enum → @RequestPart name mapping.
export const DPP_DOCUMENT_TYPE_TO_PART = {
    PRODUCT_PHOTO: 'productPhoto',
    REACH_COMPLIANCE: 'reachCompliance',
    EU_DOC_OF_CONFORMITY: 'euDeclaration',
    TEST_REPORTS: 'testReports',
    TRANSACTION_CERTIFICATES: 'transactionCerts',
    ORIGIN_CERTIFICATES: 'originCerts',
    REPAIR_MANUAL: 'repairManual',
    CARE_GUIDE: 'careGuide',
    END_OF_LIFE_GUIDE: 'endOfLifeGuide',
    SALE_INVOICE: 'saleInvoice',
    CREATION_PASSPORT: 'creationPassport',
} as const satisfies Record<string, DppFilePart>;
export type DppDocumentType = keyof typeof DPP_DOCUMENT_TYPE_TO_PART;

/** Converts a record keyed by DocumentType into the part-keyed record expected by `dpp.create`. */
export function dppFilesToParts(
    files: Partial<Record<string, File>> | undefined,
): Partial<Record<DppFilePart, File>> | undefined {
    if (!files) return undefined;
    const parts: Partial<Record<DppFilePart, File>> = {};
    for (const [docType, file] of Object.entries(files)) {
        const part = DPP_DOCUMENT_TYPE_TO_PART[docType as DppDocumentType];
        if (part && file) parts[part] = file;
    }
    return parts;
}

export const dppFormDocumentSchema = z.object({
    fileId: z.string().nullish(),
    documentType: z.string().nullish(),
    visibility: z.string().nullish(),
    filename: z.string().nullish(),
    url: z.string().nullish(),
});
export type DppFormDocument = z.infer<typeof dppFormDocumentSchema>;

// GET /api/dpp-forms/{id} — mirrors the backend DppFormResponse.
export const dppFormDtoSchema = dppFormPayloadSchema.extend({
    id: z.string(),
    publicCode: z.string().nullish(),
    createdAt: z.string(),
    status: dppStatusSchema,
    mainPhotoUrl: z.string().nullish(),
    dataHash: z.string().nullish(),
    blockchainAnchorStatus: z.string().nullish(),
    blockchainTxHash: z.string().nullish(),
    documents: z.array(dppFormDocumentSchema).nullish(),
});
export type DppFormDto = z.infer<typeof dppFormDtoSchema>;

// POST /api/dpp-forms returns only the new id; fetch the full DPP via GET /{id}.
export const dppFormCreatedDtoSchema = z.object({ id: z.string() });
export type DppFormCreatedDto = z.infer<typeof dppFormCreatedDtoSchema>;

export const dppEventActorTypeSchema = z.enum([
    'MANUFACTURER',
    'DISTRIBUTOR',
    'RETAILER',
    'CONSUMER',
    'REPAIRER',
    'RECYCLER',
]);
export type DppEventActorType = z.infer<typeof dppEventActorTypeSchema>;

// GET /api/dpp-forms/{id}/events — mirrors the backend DppEventResponse.
export const dppEventDtoSchema = z.object({
    id: z.string(),
    occurredAt: z.string(),
    description: z.string(),
    actorType: dppEventActorTypeSchema,
    createdAt: z.string().nullish(),
});
export type DppEventDto = z.infer<typeof dppEventDtoSchema>;

export const dppEventPayloadSchema = z.object({
    occurredAt: z.string(),
    description: z.string(),
    actorType: dppEventActorTypeSchema,
});
export type DppEventPayload = z.infer<typeof dppEventPayloadSchema>;

const irisAxisSchema = z.object({
    transparency: z.number(),
    craftsmanship: z.number(),
    impact: z.number(),
    repairability: z.number(),
});

// GET /api/dpp-forms/{id}/iris_score — mirrors the backend IrisScoreResponse.
export const irisScoreDtoSchema = z.object({
    total: z.number(),
    grade: z.string(),
    breakdown: irisAxisSchema,
    weights: irisAxisSchema.nullish(),
    reasons: z.array(z.unknown()).nullish(),
});
export type IrisScoreDto = z.infer<typeof irisScoreDtoSchema>;

export const dppFormSummaryDtoSchema = z.object({
    id: z.string(),
    createdAt: z.string(),
    status: dppStatusSchema,
    productName: z.string().nullable(),
    productCategory: z.string().nullable(),
    sku: z.string().nullable(),
});
export type DppFormSummaryDto = z.infer<typeof dppFormSummaryDtoSchema>;

// GET /public/dpp_forms/{code} — public read of a published DPP with its score.
export const dppFormPublicDtoSchema = z.object({
    dpp: dppFormDtoSchema,
    irisScore: irisScoreDtoSchema.nullish(),
});
export type DppFormPublicDto = z.infer<typeof dppFormPublicDtoSchema>;
