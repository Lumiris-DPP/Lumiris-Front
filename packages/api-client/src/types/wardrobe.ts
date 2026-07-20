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

// Une commande d'achat direct de l'acheteur. status : PENDING | PAID | FULFILLED | CANCELLED | REFUNDED.
export const orderDtoSchema = z.object({
    id: z.string(),
    productName: z.string().nullish(),
    amountTotalCents: z.number(),
    commissionCents: z.number(),
    currency: z.string().nullish(),
    status: z.string(),
    invoiceNumber: z.string().nullish(),
    createdAt: z.string().nullish(),
});
export type OrderDto = z.infer<typeof orderDtoSchema>;
