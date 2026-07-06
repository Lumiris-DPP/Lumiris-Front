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

export const dppFormDocumentSchema = z.object({
    id: z.string().nullish(),
    documentType: z.string().nullish(),
    visibility: z.string().nullish(),
    fileName: z.string().nullish(),
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

export const dppFormSummaryDtoSchema = z.object({
    id: z.string(),
    createdAt: z.string(),
    status: dppStatusSchema,
    productName: z.string().nullable(),
    productCategory: z.string().nullable(),
    sku: z.string().nullable(),
});
export type DppFormSummaryDto = z.infer<typeof dppFormSummaryDtoSchema>;
