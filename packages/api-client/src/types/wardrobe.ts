import { z } from 'zod';

// Une pièce de la Garde-Robe de l'acheteur (achetée en direct) : passeport + facture + garantie.
export const wardrobeItemDtoSchema = z.object({
    id: z.string(),
    dppFormId: z.string().nullish(),
    dppPublicCode: z.string().nullish(),
    productName: z.string().nullish(),
    warrantyDescription: z.string().nullish(),
    invoiceNumber: z.string().nullish(),
    acquiredAt: z.string().nullish(),
});
export type WardrobeItemDto = z.infer<typeof wardrobeItemDtoSchema>;
