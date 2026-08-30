import { z } from 'zod';

export const certificateTypeSchema = z.enum(['ORIGIN', 'TRANSACTION']);
export type CertificateLibraryType = z.infer<typeof certificateTypeSchema>;

// Certificat réutilisable pré-uploadé par l'artisan — page Certifications, sélectionnable dans
// le formulaire DPP (voir CertUploadField) au lieu d'un nouvel upload spécifique à ce passeport.
export const certificateLibraryItemSchema = z.object({
    id: z.string(),
    type: certificateTypeSchema,
    filename: z.string().nullish(),
    url: z.string().nullish(),
    usedOnDppCount: z.number(),
    createdAt: z.string(),
});
export type CertificateLibraryItem = z.infer<typeof certificateLibraryItemSchema>;
