import { z } from 'zod';

export const dppStatusSchema = z.enum(['VALID', 'INVALID']);
export type DppStatus = z.infer<typeof dppStatusSchema>;

export const dppMaterialSchema = z.object({
    fiber: z.string(),
    percentage: z.number(),
    originCountry: z.string().nullish(),
});
export type DppMaterial = z.infer<typeof dppMaterialSchema>;

export const dppCertificationSchema = z.object({
    name: z.string(),
    customName: z.string().nullish(),
    licenseNumber: z.string().nullish(),
});
export type DppCertification = z.infer<typeof dppCertificationSchema>;

// Mirrors the backend DppFormRequest.
export const dppFormPayloadSchema = z.object({
    productName: z.string().nullish(),
    productDescription: z.string().nullish(),
    productCategory: z.string().nullish(),
    originCountry: z.string().nullish(),
    availableSizes: z.array(z.string()).nullish(),
    colors: z.array(z.string()).nullish(),
    mainPhotoUrl: z.string().nullish(),
    materials: z.array(dppMaterialSchema).nullish(),
    careInstructions: z.array(z.string()).nullish(),
    certifications: z.array(dppCertificationSchema).nullish(),
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

export const dppFormDtoSchema = dppFormPayloadSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    status: dppStatusSchema,
});
export type DppFormDto = z.infer<typeof dppFormDtoSchema>;

export const dppFormSummaryDtoSchema = z.object({
    id: z.string(),
    createdAt: z.string(),
    status: dppStatusSchema,
    productName: z.string().nullable(),
    productCategory: z.string().nullable(),
    sku: z.string().nullable(),
});
export type DppFormSummaryDto = z.infer<typeof dppFormSummaryDtoSchema>;
